// composables/useRandom.js

export const useRandom = () => {

  const randomInt = (mn, mx) => {
    const min = Math.ceil(mn)
    const max = Math.floor(mx)
    return Math.floor(Math.random() * (max - min) + min)
  }

  return {
    randomInt,
  }
}