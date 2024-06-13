export const convertValuesInArray = (data = []) => {
  return data.map((item) => {
    return Object.values(item)
  })
}
