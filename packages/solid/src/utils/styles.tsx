export const STYLE_TAG_ID = 'disable-scrollbar';

export const styleDisableScrollbar = {
  class: 'base-ui-disable-scrollbar',
  element: (
    <style id={STYLE_TAG_ID}>
      {`.base-ui-disable-scrollbar{scrollbar-width:none}.base-ui-disable-scrollbar::-webkit-scrollbar{display:none}`}
    </style>
  ) as Node,
};
