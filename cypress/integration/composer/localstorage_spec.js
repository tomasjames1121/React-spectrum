import data from '../../../shared/testing/data';
const user = data.users.find(user => user.username === 'brian');

const pressEscape = () => cy.get('body').trigger('keydown', { keyCode: 27 });
const discardDraftModal = () => cy.get('[data-cy="discard-draft-modal"]');
const cancelButton = () => cy.get('[data-cy="composer-cancel-button"]');
const title = 'Some new thread';
const body = "with some fresh content you've never seen before";

describe('composer content persistence', () => {
  beforeEach(() => {
    cy.auth(user.id).then(() => cy.visit('/'));
  });

  it('should persist content if the page is refreshed', () => {
    const title = 'Some new thread';
    const body = "with some fresh content you've never seen before";
    cy.get('[data-cy="inbox-thread-feed"]').should('be.visible');
    cy.get('[data-cy="inbox-view-post-button"]')
      .should('be.visible')
      .click();
    cy.get('[data-cy="rich-text-editor"]').should('be.visible');
    cy.get('[data-cy="composer-community-selector"]')
      .should('be.visible')
      .select('Spectrum');
    cy.get('[data-cy="composer-channel-selector"]')
      .should('be.visible')
      .select('General');

    // Type title and body
    cy.get('[data-cy="composer-title-input"]').type(title);
    cy.get('[data-cy="rich-text-editor"]').type(body);
    cy.wait(600); // greater than debounce value
    cy.reload();
    cy.get('[data-cy="rich-text-editor"]').should('be.visible');
    cy.get('[data-cy="composer-title-input"]').contains(title);
    cy.get('[data-cy="rich-text-editor"]').contains(body);
  });

  it('should not persist content in the composer after publish', () => {
    cy.get('[data-cy="inbox-thread-feed"]').should('be.visible');
    cy.get('[data-cy="inbox-view-post-button"]')
      .should('be.visible')
      .click();
    cy.get('[data-cy="rich-text-editor"]').should('be.visible');
    cy.get('[data-cy="composer-community-selector"]')
      .should('be.visible')
      .select('Spectrum');
    cy.get('[data-cy="composer-channel-selector"]')
      .should('be.visible')
      .select('General');

    // Type title and body
    cy.get('[data-cy="composer-title-input"]').type(title);
    cy.get('[data-cy="rich-text-editor"]').type(body);
    cy.get('[data-cy="composer-publish-button"]').click();
    cy.location('pathname').should('contain', 'thread');
    cy.get('[data-cy="thread-view"]');
    cy.contains(title);
    cy.contains(body);
    cy.visit('/new/thread');
    cy.get('[data-cy="composer-title-input"]').should('not.contain', title);
    cy.get('[data-cy="rich-text-editor"]').should('not.contain', body);
  });
});

describe('discarding drafts', () => {
  beforeEach(() => {
    cy.auth(user.id).then(() => cy.visit('/'));
    cy.get('[data-cy="inbox-thread-feed"]').should('be.visible');
    cy.get('[data-cy="inbox-view-post-button"]')
      .should('be.visible')
      .click();
    cy.get('[data-cy="rich-text-editor"]').should('be.visible');
  });

  it('should not prompt to discard a draft if nothing has been typed', () => {
    pressEscape();
    cy.get('[data-cy="rich-text-editor"]').should('not.be.visible');
  });

  it('should prompt to discard draft if content has been typed', () => {
    cy.get('[data-cy="composer-title-input"]').type(title);
    cy.get('[data-cy="rich-text-editor"]').type(body);
    pressEscape();
    discardDraftModal().should('be.visible');
  });

  it('should prompt with cancel click', () => {
    cy.get('[data-cy="composer-title-input"]').type(title);
    cy.get('[data-cy="rich-text-editor"]').type(body);
    cancelButton().click();
    discardDraftModal().should('be.visible');
  });

  it('should prompt with overlay click', () => {
    cy.get('[data-cy="composer-title-input"]').type(title);
    cy.get('[data-cy="rich-text-editor"]').type(body);
    cy.get('body').click(200, 200);
    discardDraftModal().should('be.visible');
  });

  it('should not prompt if content is deleted midway through', () => {
    cy.get('[data-cy="composer-title-input"]').type(title);
    cy.get('[data-cy="rich-text-editor"]').type(body);
    cy.wait(600); // greater than debounce localstorage sync
    cy.get('[data-cy="composer-title-input"]').clear();
    cy.get('[data-cy="rich-text-editor"]').clear();
    cy.wait(600); // greater than debounce localstorage sync
    pressEscape();
    cy.get('[data-cy="rich-text-editor"]').should('not.be.visible');
  });

  it('should close discard confirmation modal on esc press', () => {
    cy.get('[data-cy="composer-title-input"]').type(title);
    cy.get('[data-cy="rich-text-editor"]').type(body);
    pressEscape();
    discardDraftModal().should('be.visible');
    pressEscape();
    discardDraftModal().should('not.be.visible');
    cy.get('[data-cy="rich-text-editor"]').should('be.visible');
  });

  it('should close discard confirmation modal on overlay click', () => {
    cy.get('[data-cy="composer-title-input"]').type(title);
    cy.get('[data-cy="rich-text-editor"]').type(body);
    pressEscape();
    discardDraftModal().should('be.visible');
    cy.get('body').click(200, 200);
    discardDraftModal().should('not.be.visible');
    cy.get('[data-cy="rich-text-editor"]').should('be.visible');
  });

  it('should close discard confirmation modal on cancel click', () => {
    cy.get('[data-cy="composer-title-input"]').type(title);
    cy.get('[data-cy="rich-text-editor"]').type(body);
    pressEscape();
    discardDraftModal().should('be.visible');
    cy.get('[data-cy="discard-draft-cancel"]').click();
    discardDraftModal().should('not.be.visible');
    cy.get('[data-cy="rich-text-editor"]').should('be.visible');
  });

  it('should discard draft on discard confirmation', () => {
    cy.get('[data-cy="composer-title-input"]').type(title);
    cy.get('[data-cy="rich-text-editor"]').type(body);
    pressEscape();
    discardDraftModal().should('be.visible');
    cy.get('[data-cy="discard-draft-discard"]').click();
    discardDraftModal().should('not.be.visible');
    cy.get('[data-cy="rich-text-editor"]').should('not.be.visible');
    cy.get('[data-cy="inbox-view-post-button"]')
      .should('be.visible')
      .click();
    cy.get('[data-cy="rich-text-editor"]').should('be.visible');
    cy.get('[data-cy="composer-title-input"]').should('not.contain', title);
    cy.get('[data-cy="rich-text-editor"]').should('not.contain', body);
  });
});
