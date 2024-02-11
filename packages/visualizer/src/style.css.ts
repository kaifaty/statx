import {css} from '@statx/element'

export const styles = css`
  html,
  body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: #555;
  }
  dialog {
    top: 50%;
    transform: translateY(-50%);
    width: 560px;
    z-index: 100;
    padding: 0;
    background-color: var(--background-color);
    padding: 20px;
    border: none;
    box-shadow: 1px 1px 16px 16px rgba(0, 0, 0, 0.4);
    & section {
      max-height: 550px;
      overflow-y: auto;
      scrollbar-width: thin;
    }
    & button {
      position: absolute;
      right: 8px;
      top: 8px;
    }
  }
  dialog::after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgb(0 0 0 / 25%);
  }
`
