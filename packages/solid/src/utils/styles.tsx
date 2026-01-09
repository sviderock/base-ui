export const STYLE_TAG_ID = 'disable-scrollbar';

export const styleDisableScrollbar = {
  class: 'base-ui-disable-scrollbar',
  element: () => {
    const style = document.createElement('style');
    style.id = STYLE_TAG_ID;
    style.textContent = `.base-ui-disable-scrollbar{scrollbar-width:none}.base-ui-disable-scrollbar::-webkit-scrollbar{display:none}`;
    return style;
  },
};
