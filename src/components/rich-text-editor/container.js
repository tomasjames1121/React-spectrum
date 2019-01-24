// @flow
import React from 'react';
import DraftEditor from '../draft-js-plugins-editor';
import { composeDecorators } from 'draft-js-plugins-editor';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createBlockDndPlugin from 'draft-js-drag-n-drop-plugin';
import createMarkdownPlugin from 'draft-js-markdown-plugin';
import createEmbedPlugin from 'draft-js-embed-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-perl';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import createPrismPlugin from 'draft-js-prism-plugin';
import createCodeEditorPlugin from 'draft-js-code-editor-plugin';
import OutsideClickHandler from 'src/components/outsideClickHandler';
import Icon from 'src/components/icons';
import { IconButton } from 'src/components/buttons';
import mentionsDecorator from 'shared/clients/draft-js/mentions-decorator/index.web.js';
import { isAndroid } from 'shared/draft-utils';
import MediaInput from 'src/components/mediaInput';
import Image from './Image';
import Embed, { addEmbed, parseEmbedUrl } from './Embed';
import { renderLanguageSelect } from './LanguageSelect';
import SideToolbar from './toolbar';
import {
  Wrapper,
  MediaRow,
  ComposerBase,
  Expander,
  Action,
  EmbedUI,
  customStyleMap,
} from './style';

type Props = {
  state: Object,
  onChange: Function,
  focus?: boolean,
  readOnly?: boolean,
  editorRef?: any => void,
  placeholder?: string,
  className?: string,
  style?: Object,
  version?: 2,
};

type State = {
  plugins: Array<mixed>,
  addEmbed: (Object, string) => mixed,
  addImage: (Object, string, ?Object) => mixed,
  inserting: boolean,
  embedding: boolean,
  embedUrl: string,
};

class Editor extends React.Component<Props, State> {
  editor: any;

  constructor(props: Props) {
    super(props);

    const pluginState = this.getPluginState(props);

    this.state = {
      ...pluginState,
      inserting: false,
      embedding: false,
      embedUrl: '',
    };
  }

  componentDidUpdate(prev: Props) {
    if (prev.readOnly !== this.props.readOnly) {
      this.setState({
        ...this.getPluginState(this.props),
      });
    }
  }

  getPluginState = (props: Props) => {
    const focusPlugin = createFocusPlugin();
    const dndPlugin = createBlockDndPlugin();
    const linkifyPlugin = createLinkifyPlugin({
      target: '_blank',
    });
    const embedPlugin = createEmbedPlugin({
      EmbedComponent: Embed,
    });
    const prismPlugin = createPrismPlugin({
      prism: Prism,
    });
    const codePlugin = createCodeEditorPlugin();

    const decorator = composeDecorators(
      focusPlugin.decorator,
      dndPlugin.decorator
    );

    const imagePlugin = createImagePlugin({
      decorator,
      imageComponent: Image,
    });

    return {
      plugins: [
        imagePlugin,
        prismPlugin,
        embedPlugin,
        createMarkdownPlugin({
          renderLanguageSelect: props.readOnly
            ? () => null
            : renderLanguageSelect,
        }),
        codePlugin,
        linkifyPlugin,
        dndPlugin,
        focusPlugin,
      ],
      addImage: imagePlugin.addImage,
      addEmbed: addEmbed,
    };
  };

  changeEmbedUrl = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      embedUrl: evt.target.value,
    });
  };

  addEmbed = (evt: ?SyntheticUIEvent<>) => {
    evt && evt.preventDefault();

    const { state, onChange } = this.props;
    onChange(this.state.addEmbed(state, parseEmbedUrl(this.state.embedUrl)));
    this.closeToolbar();
  };

  addImages = (files: FileList) => {
    const { addImage } = this.state;
    const { state, onChange } = this.props;
    // Add images to editorState
    // eslint-disable-next-line
    for (var i = 0, file; (file = files[i]); i++) {
      onChange(addImage(state, window.URL.createObjectURL(file), { file }));
    }
  };

  addImage = (e: SyntheticInputEvent<HTMLInputElement>) => {
    this.addImages(e.target.files);
    this.closeToolbar();
  };

  handleDroppedFiles = (_: any, files: FileList) => {
    this.addImages(files);
  };

  toggleToolbarDisplayState = () => {
    const { inserting } = this.state;

    this.setState({
      inserting: !inserting,
      embedding: false,
    });
  };

  closeToolbar = () => {
    this.setState({
      embedUrl: '',
      embedding: false,
      inserting: false,
    });
  };

  toggleEmbedInputState = () => {
    const { embedding } = this.state;

    this.setState({
      embedding: !embedding,
      inserting: false,
    });
  };

  render() {
    const {
      state,
      onChange,
      className,
      style,
      editorRef,
      focus,
      version,
      placeholder,
      readOnly,
      ...rest
    } = this.props;
    const { embedding, inserting } = this.state;

    return (
      <ComposerBase
        data-cy="rich-text-editor"
        className={`markdown ${className || ''}`}
        focus={focus}
      >
        <DraftEditor
          data-cy="rich-text-editor"
          editorState={state}
          onChange={onChange}
          plugins={this.state.plugins}
          handleDroppedFiles={this.handleDroppedFiles}
          editorRef={editor => {
            this.editor = editor;
            if (editorRef) editorRef(editor);
          }}
          readOnly={readOnly}
          placeholder={!readOnly && placeholder}
          spellCheck={true}
          autoCapitalize="sentences"
          autoComplete="on"
          autoCorrect="on"
          stripPastedStyles={true}
          decorators={[mentionsDecorator]}
          customStyleMap={customStyleMap}
          {...rest}
        />
        {!readOnly && !isAndroid() && (
          <OutsideClickHandler onOutsideClick={this.closeToolbar}>
            <SideToolbar editorState={state} editorRef={this.editor}>
              <Expander inserting={inserting}>
                <IconButton
                  glyph={'inserter'}
                  onClick={this.toggleToolbarDisplayState}
                />
                <Action>
                  <MediaInput
                    onChange={this.addImage}
                    multiple
                    tipLocation={'right'}
                  />
                </Action>
                <Action embedding={embedding}>
                  <EmbedUI onSubmit={this.addEmbed} embedding={embedding}>
                    <label htmlFor="embed-input">
                      <Icon
                        glyph={'embed'}
                        tipText={'Embed a URL'}
                        onClick={this.toggleEmbedInputState}
                      />
                      <input
                        id="embed-input"
                        type="url"
                        placeholder="Enter a URL to embed"
                        value={this.state.embedUrl}
                        onChange={this.changeEmbedUrl}
                      />
                    </label>
                    <button onClick={this.addEmbed}>Embed</button>
                  </EmbedUI>
                </Action>
              </Expander>
            </SideToolbar>
          </OutsideClickHandler>
        )}
      </ComposerBase>
    );
  }
}

export default Editor;
