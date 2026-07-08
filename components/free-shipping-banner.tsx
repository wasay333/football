const FreeShippingBanner = () => {
  return (
    <div className="announcement-bar" role="note" aria-label="Shipping announcement">
      <div className="announcement-bar__track">
        <p className="announcement-bar__text">
          <span>Free Worldwide Shipping</span>
          <span className="announcement-bar__divider" aria-hidden="true">
            |
          </span>
          <span>Tracked delivery on every order</span>
        </p>
        <p className="announcement-bar__text" aria-hidden="true">
          <span>Free Worldwide Shipping</span>
          <span className="announcement-bar__divider" aria-hidden="true">
            |
          </span>
          <span>Tracked delivery on every order</span>
        </p>
        <p className="announcement-bar__text" aria-hidden="true">
          <span>Free Worldwide Shipping</span>
          <span className="announcement-bar__divider" aria-hidden="true">
            |
          </span>
          <span>Tracked delivery on every order</span>
        </p>
      </div>
    </div>
  );
};

export default FreeShippingBanner;
