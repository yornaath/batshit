export const styles = `
.batshit-osx-scrollbars::-webkit-scrollbar {
  background-color: #fff;
  width: 14px;
}

/* background of the scrollbar except button or resizer */
.batshit-osx-scrollbars::-webkit-scrollbar-track {
  background-color: rgb(30, 30, 30);
}

/* scrollbar itself */
.batshit-osx-scrollbars::-webkit-scrollbar-thumb {
  background-color: rgba(255,255,255, 0.5);
  border-radius: 16px;
  border: 4px solid rgb(30, 30, 30);
}

/* set button(top and bottom of the scrollbar) */
.batshit-osx-scrollbars::-webkit-scrollbar-button {
  display:none;
}
`;
