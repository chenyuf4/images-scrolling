import styles from "./ImageTitle.module.scss";
import clsx from "clsx";
import { IMAGE_TITLES } from "utils/format";
const ImageTitle = ({ imgTitleRef }) => {
  return (
    <div className={clsx(styles["img-title-container"])}>
      <div className="overflow-hidden">
        <div ref={imgTitleRef} className="c-font text-white display-6">
          {IMAGE_TITLES[0]}
        </div>
      </div>
    </div>
  );
};

export default ImageTitle;
