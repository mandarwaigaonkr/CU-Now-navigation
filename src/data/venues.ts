// src/data/venues.ts
// Static venue registry — maps venue names to blocks, images, and default directions.
// Images are served from public/venues/ to avoid Firebase Storage costs.

export interface Venue {
  id: string;
  name: string;
  block: string;
  image: string;
  defaultDirections: string;
}

const VENUES: Venue[] = [
  // ─── Numbered Blocks ───
  {
    id: 'block-1-audi',
    name: 'Block 1',
    block: '1st Block',
    image: '/venues/first_block.jpeg',
    defaultDirections:
      'From the Main Gate, take the main road that runs through campus. The 1st Block is the first major building on your left side. The Auditorium is located inside.',
  },
  {
    id: 'block-2',
    name: 'Block 2',
    block: '2nd Block',
    image: '/venues/second_block.jpg',
    defaultDirections: 'Located along the main road of the campus, near the open auditorium.',
  },
  {
    id: 'block-3-audi',
    name: 'Block 3',
    block: '3rd Block',
    image: '/venues/third_block.jpg',
    defaultDirections:
      'From the Main Gate, walk along the main road. Pass the 1st and 2nd Blocks on your left. The 3rd Block is next. The Auditorium is located inside.',
  },
  {
    id: 'block-4',
    name: 'Block 4',
    block: '4th Block',
    image: '/venues/fourth_block.jpg',
    defaultDirections: 'Follow the main road towards the central campus area. Block 4 houses the library and canteens.',
  },
  {
    id: 'block-5',
    name: 'Block 5 (Center OF Execellence)',
    block: '5th Block',
    image: '/venues/fifth_block.jpg',
    defaultDirections: 'Pass Block 1, 2, and 3. The 5th Block is further ahead on the left side.',
  },
  {
    id: 'block-6',
    name: 'Block 6',
    block: '6th Block',
    image: '/venues/sixth_block.jpg',
    defaultDirections: 'Walk along the main road towards the far end of campus. The 6th Block is one of the last buildings.',
  },

  // ─── Special Blocks & Areas ───
  {
    id: 'pu-block',
    name: 'PU Block',
    block: 'PU Block',
    image: '/venues/pu_block.jpg',
    defaultDirections:
      'From the Main Gate, walk straight ahead. The PU Block is located on the right side of the campus. Follow the signs for PU Block.',
  },

  {
    id: 'arch-block',
    name: 'Architecture Block',
    block: 'Architecture Block',
    image: '/venues/arch_block_fixed.JPG',
    defaultDirections: 'Follow the signs on campus for the Architecture Block.',
  },
  {
    id: 'devdan-block',
    name: 'Devdan Block',
    block: 'Devdan Block',
    image: '/venues/Devdan_block.jpg',
    defaultDirections: 'Follow the signs on campus for the Devdan Block.',
  },
  {
    id: 'open-audi',
    name: 'Open Audi',
    block: 'Open Auditorium',
    image: '/venues/open_audi.png',
    defaultDirections:
      'From the Main Gate, walk along the main road. The Open Auditorium is located near the 2nd Block on the left side of the campus.',
  },
  {
    id: 'amphitheater',
    name: 'Amphitheater',
    block: 'Amphitheater',
    image: '/venues/amphi_theater_rotated.JPG',
    defaultDirections: 'Located centrally on campus.',
  },
  {
    id: 'main-ground',
    name: 'Main Ground and Basketball Court',
    block: 'Grounds',
    image: '/venues/second_block.jpg', // Placeholder
    defaultDirections: 'The main sports grounds and basketball court.',
  },
  {
    id: 'car-parking',
    name: 'Car Parking',
    block: 'Parking',
    image: '/venues/pu_block.jpg', // Placeholder
    defaultDirections: 'Follow the signs for the main car parking.',
  },
  {
    id: '2-wheeler-parking',
    name: '2 Wheeler Parking',
    block: 'Parking',
    image: '/venues/second_block.jpg', // Placeholder
    defaultDirections: 'Designated parking for two-wheelers.',
  }
]

/**
 * Find venue data by matching the event's venue string (case-insensitive).
 * Returns the venue object or null if not found.
 */
export function getVenueByName(venueName?: string | null): Venue | null {
  if (!venueName) return null
  const lower = venueName.toLowerCase().trim()
  return VENUES.find(v => v.name.toLowerCase() === lower) || null
}

/** List of venue names for admin dropdown */
export const VENUE_LIST = VENUES.map(v => v.name)

/** Get default directions for a venue name (for admin copy feature) */
export function getDefaultDirections(venueName?: string | null): string {
  const venue = getVenueByName(venueName)
  return venue?.defaultDirections || ''
}

export default VENUES
