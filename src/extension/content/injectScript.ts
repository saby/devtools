const injectScript = ({
   fileName,
   textContent
}: {
   fileName?: string;
   textContent?: string;
}) => {
   const scriptElement = document.createElement('script');
   scriptElement.setAttribute('type', 'text/javascript');
   if (fileName) {
      scriptElement.src = chrome.extension.getURL(fileName);
   } else if (textContent) {
      scriptElement.textContent = textContent;
   }
   document.documentElement.appendChild(scriptElement);
   if (scriptElement.parentNode) {
      scriptElement.parentNode.removeChild(scriptElement);
   }
};

export { injectScript };
