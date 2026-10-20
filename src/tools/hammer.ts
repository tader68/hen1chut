export interface Tool {
  id: string
  label: string
  power: number
  words: string[]
}

export const hammer: Tool = {
  id: 'hammer',
  label: 'Búa cao su',
  power: 1,
  words: ['BỐP!', 'BỊCH!', 'CỘP!', 'BỘP!'],
}
