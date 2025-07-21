/**
 * Utility functions for smooth scrolling
 */

export const scrollToElement = (elementId: string, offset: number = 80) => {
  const element = document.getElementById(elementId)
  if (element) {
    const elementPosition = element.offsetTop - offset
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    })
  }
}

export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

export const scrollToSection = (sectionId: string) => {
  scrollToElement(sectionId, 80) // Default header offset
}

export const scrollToProducts = () => {
  scrollToSection('all-products')
} 