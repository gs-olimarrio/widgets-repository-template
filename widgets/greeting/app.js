export async function init(sdk) {
  await sdk.whenReady();

  const card = sdk.$(".greeting-card");
  const title = sdk.$(".title");
  const subtitle = sdk.$(".subtitle");

  function applyProps(props) {
    if (title) title.textContent = props.title || "Hello, Community!";
    if (subtitle) subtitle.textContent = props.subtitle || "This is your first custom widget.";
    if (card) {
      var start = props.gradientStart || "#667eea";
      var end = props.gradientEnd || "#4facfe";
      card.style.background = "linear-gradient(135deg, " + start + ", " + end + ")";
    }
  }

  applyProps(sdk.getProps());
  sdk.on("propsChanged", applyProps);
}
