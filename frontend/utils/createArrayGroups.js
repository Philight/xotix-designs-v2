export const createArrayGroups = (groupSize, initialArray) => {
  const reduced = initialArray.reduce((resultArray, element, index) => {
    // Create Array Group, before each groupSize
    if (index % groupSize === 0) {
      resultArray.push([]);
    }
    // Last Pushed Array Group - add elements
    resultArray[resultArray.length - 1].push(element);
    return resultArray;
  }, []);

  return reduced;
};
