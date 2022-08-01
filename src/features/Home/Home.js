import clsx from "clsx";
import styles from "./Home.module.scss";
const Home = () => {
  return (
    <div className={clsx(styles["home-container"], "p-4")}>
      <div className="s-font">STEPHEN</div>
    </div>
  );
};

export default Home;
