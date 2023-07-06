import { useState, useEffect } from 'react';

const BREAKPOINTS = [
  { DEVICE: 'DESKTOP_XL', MIN_WIDTH: 1920 },
  { DEVICE: 'DESKTOP_LG', MIN_WIDTH: 1440 },
  { DEVICE: 'DESKTOP_MD', MIN_WIDTH: 1200 },
  { DEVICE: 'DESKTOP_SM', MIN_WIDTH: 1024 },
  { DEVICE: 'TABLET_LG', MIN_WIDTH: 900 },
  { DEVICE: 'TABLET_MD', MIN_WIDTH: 768 },
  { DEVICE: 'TABLET_SM', MIN_WIDTH: 600 },
  { DEVICE: 'MOBILE_LG', MIN_WIDTH: 480 },
  { DEVICE: 'MOBILE_SM', MIN_WIDTH: 0 },
];

const getDeviceType = (width) => {
  for (const BP of BREAKPOINTS) {
    if (width >= BP.MIN_WIDTH) {
      return BP.DEVICE;
    }
  }
  return 'MOBILE_SM';
};

const isTouchDevice = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    DEVICE_WIDTH: width,
    DEVICE_HEIGHT: height,
    DEVICE_TYPE: getDeviceType(width),
    DEVICE_IS_TOUCH: isTouchDevice(),
  };
}

export default function useDeviceDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions(),
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}
