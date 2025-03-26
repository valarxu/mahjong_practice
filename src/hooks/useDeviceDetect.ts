import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
}

export function useDeviceDetect(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isSmallMobile: false
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setDeviceInfo({
        isMobile: width < 576,
        isTablet: width >= 576 && width < 992,
        isDesktop: width >= 992,
        isSmallMobile: width < 400
      });
    };

    // 初始检测
    handleResize();

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
} 