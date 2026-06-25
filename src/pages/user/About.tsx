import { useMemo, useState } from 'react'
import VENUES from '../../data/venues'
import Navbar from '../../components/Navbar'
import './About.css'

const ADDITIONAL_FACILITIES: Record<string, string[]> = {
  '1st Block': ['Admission Office', 'Director\'s Office', 'Office of International Affairs', 'Block 1 Audi', 'University Media Team'],
  '2nd Block': ['SWO Office'],
  '3rd Block': ['CAPS Office', 'Sports Department', 'Choir'],
  '4th Block': ['Stationery', 'Indoor Canteens', 'Gym', 'Library'],
  '5th Block': ['IEEE Office', 'IIIC Office', 'Office of Examination'],
  '6th Block': [],
  'PU Block': ['A residential college focusing on international standards curriculum for pre-university'],
  'Architecture Block': ['workshop classrooms', 'CICF Office', 'crystal block', 'conference room'],
  'Devdan Block': ['Boys hostel', 'North canteen (pure Veg)', 'civil block', 'ardc office', 'work-integrated classrooms'],
  'Amphitheater': []
}

const BLOCK_DESCRIPTIONS: Record<string, string> = {
  'Architecture Block': 'A modern infrastructure design by alumni of the architecture field, known for magnificent class rooms, workshops etc.',
  'Devdan Block': 'A residential boys hostel.',
  'Amphitheater': 'A vibrant nature spot surrounded by lush green ambiance #naturelovers'
}

interface BlockData {
  name: string;
  image: string;
  facilities: string[];
}

const SECTIONS = [
  { id: 'facilities', title: 'Facilities', content: null },
  { id: 'directory', title: 'College Directory', content: 'Important contact information for various departments and faculty members.' },
  { id: 'rules', title: 'Rules & Regulations', content: `The Student Code of Conduct at CHRIST (Deemed to be University) aims to maintain a respectful, disciplined, and academically responsible campus environment. Students are expected to uphold the university's values, follow institutional regulations, and contribute positively to the campus community.

## Key Expectations
• Maintain discipline, decorum, and respect for faculty, staff, and fellow students.
• Follow the prescribed dress code and carry a valid university ID card at all times.
• Be punctual for classes and adhere to classroom etiquette.
• Mobile phones must remain switched off in classrooms, libraries, and university offices.
• Avoid loitering, crowding, reckless behavior, or possession of prohibited substances on campus.
• Comply with all instructions and regulations issued by the university.

## Academic Integrity
• All assignments, projects, and research work must be original.
• Plagiarism, copying, or presenting others' work as one's own is strictly prohibited and may result in disciplinary action.

## Responsible Use of University Resources
• Students must use campus facilities responsibly and avoid damaging university property.
• Maintain cleanliness in classrooms, libraries, laboratories, hostels, and common areas.
• Follow library, IT, hostel, and campus resource usage guidelines.

## University Regulations
Students are required to comply with all university policies, including regulations related to examinations, anti-ragging measures, substance abuse prevention, and prevention of sexual harassment.

## Disciplinary Measures
Failure to follow the Code of Conduct may lead to disciplinary action. Serious or repeated violations can result in suspension, expulsion, or other penalties as determined by the university.

This code ensures a safe, inclusive, and productive learning environment while promoting academic excellence, integrity, and responsible citizenship.` }
]

export default function About() {
  const [activeSection, setActiveSection] = useState<string>('facilities')
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)
  
  // Group venues by their block
  const blocks = useMemo(() => {
    const blocksMap = VENUES.reduce((acc: Record<string, BlockData>, venue) => {
      // Use the block name as the key
      const blockKey = venue.block || 'Other'
      if (!acc[blockKey]) {
        acc[blockKey] = {
          name: blockKey,
          image: venue.image || '/venues/default.jpg',
          facilities: []
        }
      }
      // Add the venue/lab if it's different from the block name itself
      if (venue.name !== blockKey) {
        if (!acc[blockKey].facilities.includes(venue.name)) {
          acc[blockKey].facilities.push(venue.name)
        }
      }
      return acc
    }, {})

    // Add additional facilities and ensure all blocks exist
    const imageFallbacks: Record<string, string> = {
      '1st Block': '/venues/first_block.jpeg',
      '4th Block': '/venues/fourth_block.jpg'
    }

    Object.keys(ADDITIONAL_FACILITIES).forEach(blockKey => {
      if (!blocksMap[blockKey]) {
        blocksMap[blockKey] = {
          name: blockKey,
          image: imageFallbacks[blockKey] || '/venues/first_block.jpg',
          facilities: []
        }
      }
      ADDITIONAL_FACILITIES[blockKey].forEach(fac => {
        if (!blocksMap[blockKey].facilities.includes(fac)) {
          blocksMap[blockKey].facilities.push(fac)
        }
      })
    })

    // Convert to array
    const blocksArray = Object.values(blocksMap)

    // Define the custom order requested
    const customOrder = [
      '1st Block',
      '2nd Block',
      'Open Auditorium',
      '3rd Block',
      '4th Block',
      '5th Block',
      '6th Block',
      'PU Block',
      'Architecture Block',
      'Devdan Block',
      'Amphitheater'
    ]

    // Sort based on the custom order
    blocksArray.sort((a, b) => {
      const indexA = customOrder.indexOf(a.name)
      const indexB = customOrder.indexOf(b.name)
      
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      
      return indexA - indexB
    })

    return blocksArray
  }, [])

  return (
    <div className="about-page">
      <header className="about-header">
        <h1>Welcome to Campus</h1>
        <p>Your guide to facilities, locations, and essential information</p>
      </header>

      <div className="about-tabs">
        {SECTIONS.map(section => (
          <button 
            key={section.id} 
            className={`about-tab ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.title}
          </button>
        ))}
      </div>

      <div className="about-content">
        <div className="about-tab-content">
          {activeSection === 'facilities' ? (
            <div className="blocks-container">
              {blocks.map((block, index) => {
                const isExpanded = expandedBlock === block.name;
                return (
                  <div 
                    key={index} 
                    className={`block-card ${isExpanded ? 'block-card--expanded' : ''}`}
                    onClick={() => setExpandedBlock(isExpanded ? null : block.name)}
                  >
                    <div className="block-card__image-wrapper">
                      <img src={block.image} alt={block.name} className="block-card__image" loading="lazy" />
                      <div className="block-card__image-overlay">
                        <h3 className="block-card__title">{block.name}</h3>
                        <svg className={`block-card__chevron ${isExpanded ? 'open' : ''}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    </div>
                    
                    <div className={`block-card__expanded-content ${isExpanded ? 'open' : ''}`}>
                      {(block.facilities.length > 0 || BLOCK_DESCRIPTIONS[block.name]) ? (
                        <div className="block-card__content">
                          {BLOCK_DESCRIPTIONS[block.name] && (
                            <p className="block-card__description">{BLOCK_DESCRIPTIONS[block.name]}</p>
                          )}
                          {block.facilities.length > 0 && (
                            <>
                              <h4 className="block-card__subtitle">Facilities & Labs</h4>
                              <ul className="block-card__list">
                                {block.facilities.map((facility, i) => (
                                  <li key={i} className="block-card__list-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="list-icon">
                                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                      <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    {facility}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="block-card__content">
                          <p className="block-card__empty">No facilities listed.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="placeholder-content">
              <div className="content-box">
                {SECTIONS.find(s => s.id === activeSection)?.content?.split('\n').map((line, i) => {
                  if (!line.trim()) return <div key={i} className="content-spacer"></div>;
                  if (line.startsWith('## ')) {
                    return <h3 key={i} className="content-heading">{line.replace('## ', '')}</h3>
                  }
                  if (line.startsWith('• ')) {
                    return <div key={i} className="content-bullet"><span className="bullet-point">•</span> {line.replace('• ', '')}</div>
                  }
                  return <p key={i} className="content-body">{line}</p>
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ flexShrink: 0 }}>
        <Navbar />
      </div>
    </div>
  )
}
