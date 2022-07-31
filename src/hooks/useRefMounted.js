import { useEffect, useRef } from "react";

const useRefMounted = () => {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  return mounted;
};

export default useRefMounted;
