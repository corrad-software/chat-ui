export const useScroll = () => {
  const isAtBottom = (element, threshold = 100) => {
    if (!element) return true;
    const scrollBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    return scrollBottom <= threshold;
  };

  return {
    isAtBottom,
  };
};
