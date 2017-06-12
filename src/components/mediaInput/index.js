import React from 'react';
import { MediaLabel, MediaInput } from './style';
import Icon from '../icons';

export default ({
  onChange,
  accept = '.png, .jpg, .jpeg, .gif, .mp4',
  multiple = false,
}) => (
  <MediaLabel>
    <MediaInput
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={onChange}
    />
    <Icon glyph="photo" tipLocation="top-right" tipText="Upload Photo" subtle />
  </MediaLabel>
);
