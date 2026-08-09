export async function init(sdk) {
  await sdk.whenReady();

  function applyProps(props) {
    var title    = sdk.$('#tp-title');
    var desc     = sdk.$('#tp-desc');
    var btn      = sdk.$('#tp-btn');
    var btnLabel = sdk.$('#tp-btn-label');
    var img      = sdk.$('#tp-image');
    var placeholder = sdk.$('#tp-placeholder');

    if (title) title.textContent = props.title || 'Test ons nieuwste product';
    if (desc)  desc.textContent  = props.description || '';
    if (btnLabel) btnLabel.textContent = props.buttonLabel || 'Meld je aan';
    if (btn && props.signUpUrl) btn.href = props.signUpUrl;

    if (img && placeholder) {
      if (props.imageUrl) {
        img.src = props.imageUrl;
        img.style.display = 'block';
        placeholder.style.display = 'none';
      } else {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
      }
    }
  }

  applyProps(sdk.getProps());
  sdk.on('propsChanged', applyProps);
}
