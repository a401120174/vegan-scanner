
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: { [key: string]: any }
    ) => void;
  }
}

export const event = (
  action: string,
  params: { [key: string]: any }
) => {
  window.gtag('event', action, params);
};