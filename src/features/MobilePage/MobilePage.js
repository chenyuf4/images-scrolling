import styles from "./MobilePage.module.scss";
import clsx from "clsx";
const MobilePage = () => {
  return (
    <div
      className={clsx(
        styles["mobile-page-container"],
        "d-flex justify-content-center align-items-center c-font"
      )}
    >
      Please view it on deskop
    </div>
  );
};
export default MobilePage;
