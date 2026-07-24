export async function init(sdk) {
  await sdk.whenReady();

  const card = sdk.$(".greeting-card");
  const title = sdk.$(".title");
  const subtitle = sdk.$(".subtitle");

  function applyProps(props) {
    if (title) title.textContent = props.title || "Hello, Community!";
    if (subtitle) subtitle.textContent = props.subtitle || "This is your first custom widget.";
    if (card) {
      var start = props.gradientStart || "#F7941D";
      var end = props.gradientEnd || "#EF4B36";
      card.style.background = "linear-gradient(135deg, " + start + ", " + end + ", " + start + ", " + end + ")";
      card.style.backgroundSize = "400% 400%";
    }
  }

  applyProps(sdk.getProps());
  sdk.on("propsChanged", applyProps);
}
