// Raw roster source data.
//
// The five featured schools use real published rosters (transcribed from their
// athletics sites). Filler schools are real NCAA Division III programs whose
// rosters are generated from name pools so the league table, schedule, and
// leaderboards feel full and competitive. All advanced stats everywhere are
// simulated for this demo.

import type { Team } from './types'

// Compact roster row: [number, name, position, height, weight, year, hometown, previousSchool]
// height '' and weight 0 mean unknown. position uses the school's own labels
// (GK / D / B / M / F and combos like B/M, M/F) and is normalized later.
export type RosterRow = [
  string, // number
  string, // name
  string, // position label
  string, // height label (e.g. 6'1")
  number, // weight lbs
  string, // class year (raw)
  string, // hometown
  string, // previous school
]

export interface FeaturedTeamSource {
  meta: Team
  rows: RosterRow[]
}

export interface FillerTeamSource {
  meta: Team
  rosterSize: number
}

const EMORY_ROWS: RosterRow[] = [
  ['0', 'Sharan Dodwani', 'GK', `6'1"`, 175, 'Junior', 'Oldham County, KY', 'North Oldham'],
  ['00', 'Barrett Eskenazi', 'GK', `6'2"`, 195, 'Freshman', 'Hillsborough, CA', 'Bellarmine College Prep'],
  ['1', 'Keirnan Skelly', 'GK', `6'2"`, 185, 'Senior', 'Newnan, GA', 'The Heritage School'],
  ['2', 'Prescott Bayman', 'M', `5'9"`, 145, 'Junior', 'Atlanta, GA', 'The Lovett School'],
  ['3', 'Jaden Emoghene', 'M', `5'9"`, 155, 'Junior', 'Kennesaw, GA', 'Mount Paran'],
  ['5', 'Michael Constant', 'D', `6'3"`, 165, 'Junior', 'Carrollton, TX', 'Prestonwood Christian Academy'],
  ['6', 'Logan Steren', 'M', `6'0"`, 175, 'Junior', 'Gaithersburg, MD', 'Bullis'],
  ['7', 'Julian Hee', 'M', `5'11"`, 165, 'Junior', 'Charlotte, NC', 'Providence Day School'],
  ['8', 'Jack Burgess', 'M', `5'10"`, 160, 'Graduate', 'Hampton, NH', 'Phillips Exeter Academy'],
  ['9', 'Adeyemi Oni', 'F', '', 0, 'Senior', 'London, England', 'Repton School'],
  ['10', 'Josh Grand', 'M', `6'0"`, 160, 'Senior', 'Atlanta, GA', 'Atlanta International School'],
  ['11', 'Lorenzo Avalos', 'F', `5'10"`, 170, 'Junior', 'Alpharetta, GA', 'Alpharetta'],
  ['12', 'Landon Redding', 'D', `5'10"`, 165, 'Junior', 'Cypress, TX', 'Bridgeland'],
  ['13', 'Georgios Kantaras', 'D', `6'0"`, 175, 'Junior', 'Tampa, FL', 'Berkeley Prep'],
  ['14', 'Christopher Marchant', 'D', `6'3"`, 200, 'Junior', 'Heilbronn, Germany', 'Mönchsee Gymnasium'],
  ['15', "Will O'Connor", 'F', `6'0"`, 165, 'Graduate', 'Milwaukee, WI', 'Shorewood'],
  ['16', 'Finn Jacobson', 'F', `6'1"`, 185, 'Sophomore', 'Atlanta, GA', 'Atlanta International School'],
  ['17', 'Paul Saah Jr.', 'M', `5'9"`, 170, 'Senior', 'Roswell, GA', 'Milton'],
  ['18', 'Mateo Rouhbakhsh', 'M', `6'2"`, 155, 'Sophomore', 'Hattiesburg, MS', 'Sacred Heart'],
  ['19', 'Nick Carrano', 'M', `5'10"`, 155, 'Junior', 'Atlanta, GA', 'The Lovett School'],
  ['20', 'Sebastian Salm', 'D', `5'11"`, 145, 'Sophomore', 'New Orleans, LA', 'Willow'],
  ['21', 'Josh Ali', 'D', `6'1"`, 176, 'Sophomore', 'Columbus, OH', 'Upper Arlington'],
  ['22', 'Danny Moya', 'M', `5'10"`, 168, 'Graduate', 'Shirley, NY', 'William Floyd'],
  ['23', 'Maximo Cisneros', 'M', `5'11"`, 160, 'Freshman', 'Los Angeles, CA', 'Crossroads'],
  ['24', 'Owen Clark', 'D', `6'4"`, 170, 'Senior', 'Harrisburg, PA', 'Central Dauphin'],
  ['26', 'Drew Pintacuda', 'M', '', 0, 'Freshman', 'Bradenton, FL', 'Lakewood Ranch'],
  ['27', 'Phillip Head', 'D', `6'4"`, 185, 'Sophomore', 'Suwanee, GA', 'Lambert'],
  ['28', 'Terence Noh', 'M', `5'11"`, 165, 'Freshman', 'Suwanee, GA', 'Pace Academy'],
  ['29', 'Parker Rubinacci', 'F', '', 0, 'Freshman', 'Charlotte, NC', 'Charlotte Latin School'],
  ['30', 'Vincent Maraschiello', 'F', `5'11"`, 170, 'Sophomore', 'Lilburn, GA', 'Providence Christian Academy'],
  ['34', 'Benny Hayward', 'M', `6'4"`, 195, 'Sophomore', 'Moncks Corner, SC', 'Pinewood Preparatory School'],
  ['35', 'Jake Breitegan', 'F', `5'10"`, 145, 'Sophomore', 'Scottsdale, AZ', 'Chaparral'],
  ['37', 'Ibrahim Karabay', 'M', `5'7"`, 145, 'Freshman', 'Kirkland, WA', 'Lake Washington'],
  ['39', 'Jacob Wahba', 'M', `5'10"`, 160, 'Sophomore', 'Odessa, FL', 'Berkeley Prep'],
  ['40', 'Ignacio Cubeddu', 'F', `5'11"`, 180, 'Graduate', 'Davie, FL', 'St. Thomas Aquinas'],
  ['99', 'Geoffrey Halpern', 'GK', `6'2"`, 175, 'Junior', 'Atlanta, GA', 'Paideia School'],
]

const BABSON_ROWS: RosterRow[] = [
  ['0', 'Derek Polanco', 'GK', `5'9"`, 150, 'Sophomore', 'Verona, NJ', 'Delbarton School'],
  ['1', 'Walker White', 'GK', `6'3"`, 190, 'Junior', 'Coral Gables, FL', 'Ransom Everglades'],
  ['2', 'Ryan Grund', 'M', `5'10"`, 160, 'Graduate', 'Princeton Junction, NJ', 'West Windsor-Plainsboro South'],
  ['3', 'Liam Goldstein', 'B', `5'11"`, 178, 'Sophomore', 'Princeton, NJ', 'The Pennington School'],
  ['4', 'Lyndon Way', 'B/F', `6'3"`, 190, 'Junior', 'Atlanta, GA', "St. John's School"],
  ['5', 'Matthew Ziegler', 'B/M', `5'10"`, 160, 'Sophomore', 'Weston, FL', 'NSU University School'],
  ['6', 'Patrick Demaso', 'B', `5'9"`, 170, 'Junior', 'Easton, CT', 'Fairfield Ludlowe'],
  ['7', 'Lorenzo Mancini', 'M', `6'2"`, 180, 'Senior', 'Franklin, MA', 'Xaverian Brothers'],
  ['8', 'Joao Araujo', 'B/M', `5'9"`, 155, 'Sophomore', 'Boca Raton, FL', "Saint Andrew's School"],
  ['9', 'Joseph Cardaropoli', 'F', `6'0"`, 165, 'Senior', 'Longmeadow, MA', 'Longmeadow'],
  ['10', 'Robin Pestka', 'M/F', `5'9"`, 160, 'Sophomore', 'Highland Park, NJ', 'Highland Park'],
  ['11', 'Samuel Kalishman', 'M', `5'10"`, 170, 'Senior', 'Clarksville, MD', "St. Paul's School for Boys"],
  ['12', 'Liam Rhatigan', 'M/F', `6'1"`, 170, 'Senior', 'Holderness, NH', "St. George's School"],
  ['13', 'Matias Gutierrez', 'B/M', `5'9"`, 145, 'Junior', 'Coral Gables, FL', 'Westminster Christian School'],
  ['14', 'Nate Rouette', 'M/F', `6'2"`, 170, 'Junior', 'Suffield, CT', 'Suffield Academy'],
  ['15', 'Ted Rosenfeld', 'B/M', `5'10"`, 168, 'Freshman', 'Morristown, NJ', 'Morristown'],
  ['16', 'Sam Morgan', 'M/F', `5'9"`, 165, 'Graduate', 'Charles Town, WV', 'West Virginia University'],
  ['17', 'Louis Gazo', 'F', `6'1"`, 185, 'Senior', 'Colchester, VT', 'University of Vermont'],
  ['18', 'Justin Stone', 'B/M/F', `6'1"`, 180, 'Graduate', 'Cary, NC', 'Davidson College'],
  ['19', 'Alexander Yablonovskiy', 'M/F', `6'3"`, 195, 'Freshman', 'Berkeley Heights, NJ', 'Governor Livingston'],
  ['20', 'Will Lloyd', 'M', `5'11"`, 165, 'Freshman', 'Lexington, MA', 'Lexington'],
  ['21', 'Luca Tusche', 'M', `6'0"`, 175, 'Freshman', 'Montville, NJ', 'Delbarton School'],
  ['22', 'Ryan Kim', 'B/M', `5'11"`, 175, 'Senior', 'San Ramon, CA', 'University of Massachusetts'],
  ['23', 'James Modiano', 'M', `5'11"`, 165, 'Sophomore', 'Montclair, NJ', 'Montclair'],
  ['24', 'Will Anderson', 'M', `5'6"`, 160, 'Freshman', 'Tampa, FL', 'Plant'],
  ['26', 'McKenzy Pierre', 'M', `5'11"`, 164, 'Freshman', 'West Orange, NJ', 'Delbarton School'],
  ['27', 'Tyler Shin', 'M', `5'8"`, 147, 'Freshman', 'Chantilly, VA', 'Freedom'],
  ['28', 'Peter Tcheleshev', 'F', `6'3"`, 170, 'Sophomore', 'Old Tappan, NJ', 'Berkshire School'],
  ['29', 'Mario Pinto', 'B/F', `6'1"`, 170, 'Sophomore', 'Chestnut Hill, MA', 'Buckingham, Browne & Nichols School'],
  ['30', 'Ben Cosentino', 'B/M', `6'0"`, 175, 'Freshman', 'Farmington, CT', 'Farmington'],
  ['31', 'Troy Stacey', 'B/F', `6'1"`, 185, 'Sophomore', 'Belmont, MI', 'Grand Rapids Central Catholic'],
  ['32', 'Huey Miller', 'B/M', `5'9"`, 158, 'Freshman', 'Gill, MA', 'Northfield Mount Hermon School'],
  ['34', 'Mack Lemkau', 'GK', `6'4"`, 185, 'Senior', 'Bedford, NY', "St. Luke's School"],
  ['36', 'Owen Guglielmino', 'M', `5'11"`, 158, 'Graduate', 'Cheshire, CT', 'University of Connecticut'],
]

const SUFFOLK_ROWS: RosterRow[] = [
  ['0', 'Ian Caldwell', 'GK', `6'0"`, 160, 'Sophomore', 'Eagle River, AK', 'Family Partnership Charter School'],
  ['1', 'Nathan Harlow', 'GK', `6'3"`, 165, 'Junior', 'London, England', 'Taft School'],
  ['2', 'Faisal Bajunaid', 'M', `5'7"`, 150, 'Graduate', 'Jeddah, Saudi Arabia', 'Merrimack College'],
  ['3', 'Logan Hawley', 'D', `5'9"`, 160, 'Freshman', 'Wake Forest, NC', 'Franklin Academy'],
  ['4', 'Javen Ironside', 'D', `6'0"`, 175, 'Sophomore', "Land O' Lakes, FL", "Land O' Lakes Christian School"],
  ['5', 'Matthew Moreno', 'M', `5'11"`, 190, 'Senior', 'Hamilton Parish, Bermuda', 'Williston Northampton School'],
  ['6', 'Lucca Giammattei', 'M', `6'0"`, 160, 'Junior', 'Miami, FL', 'Gulliver Prep'],
  ['7', 'Maxi Fadel', 'M', `6'0"`, 165, 'Freshman', 'Key Biscayne, FL', 'Immaculata-La Salle'],
  ['8', 'Ford Lee', 'M', `5'11"`, 155, 'Senior', 'Atlanta, GA', 'Atlanta International School'],
  ['9', 'Luke Blawn', 'F', `6'2"`, 175, 'Junior', 'Orlando, FL', 'Boone'],
  ['10', 'Diego Pierantozzi', 'F', `5'9"`, 160, 'Senior', 'Weston, FL', 'Cypress Bay'],
  ['11', 'Francisco Valck', 'F', `6'0"`, 165, 'Junior', 'Weston, FL', 'Cypress Bay'],
  ['12', 'Ricardo Feliciani', 'D', `6'1"`, 180, 'Junior', 'Weston, FL', 'Cypress Bay'],
  ['13', 'Oliver Heth', 'D', `6'3"`, 185, 'Junior', 'Singapore', 'Briar Cliff'],
  ['14', 'Ryan Chamberlain', 'D', `5'10"`, 150, 'Senior', 'Bethel, CT', 'Bethel'],
  ['15', 'Christian Gardner', 'M', `5'9"`, 165, 'Sophomore', 'Miami, FL', 'Avon Old Farms'],
  ['16', 'Sebastian Gonzalez Vazquez', 'D', `5'8"`, 150, 'Freshman', 'New York, NY', 'IMG Academy'],
  ['17', 'Dylan Trachtenberg', 'F', `6'2"`, 175, 'Sophomore', 'Boca Raton, FL', 'Olympic Heights Community'],
  ['18', 'Thiago Rubino', 'M', `5'11"`, 170, 'Freshman', 'West Newton, MA', 'Newton North'],
  ['19', 'Sebastian Paba', 'M', `5'11"`, 155, 'Freshman', 'Miami, FL', 'Cypress Bay'],
  ['20', 'Dylan Cadavid', 'F', `5'10"`, 165, 'Freshman', 'Tyngsboro, MA', 'Tyngsboro'],
  ['21', 'Mohamed Mehaya', 'F', `6'1"`, 155, 'Freshman', 'East Boston, MA', 'Excel Academy'],
  ['23', 'Emiliano Esquer', 'D', `5'11"`, 180, 'Senior', 'San Diego, CA', 'St. Augustine'],
  ['24', 'Tyler Retchin', 'F', `6'0"`, 175, 'Freshman', 'East Longmeadow, MA', 'East Longmeadow'],
  ['25', 'Martin Avila', 'D', `5'11"`, 155, 'Freshman', 'Key Biscayne, FL', 'MAST Academy'],
  ['26', 'Matthew Belluardo', 'D', `6'4"`, 200, 'Senior', 'Mahwah, NJ', 'Mahwah'],
  ['27', 'Yohan Chung', 'M', `5'8"`, 145, 'Freshman', 'Closter, NJ', 'Northern Valley Regional'],
  ['28', 'Dylan Rowe', 'M', `5'9"`, 165, 'Freshman', 'Delmar, NY', 'Bethlehem Central'],
  ['29', 'Zach Vlachos', 'F', `6'0"`, 170, 'Junior', 'Peabody, MA', "St. John's Prep"],
  ['30', 'Carter Sewell', 'GK', `6'2"`, 195, 'Sophomore', 'Madison, AL', 'Bob Jones'],
  ['31', 'Jeremy Cooke', 'M', `6'3"`, 180, 'Senior', 'Norwalk, CT', 'King School'],
  ['32', 'Tommy Kurz', 'F', `6'1"`, 165, 'Senior', 'New Canaan, CT', 'New Canaan'],
  ['33', 'Carter Van Buskirk', 'M', `5'10"`, 155, 'Senior', 'St. Louis, MO', 'Marquette High School'],
  ['34', 'Yan Haiat', 'M', `5'8"`, 155, 'Sophomore', 'Rio de Janeiro, Brazil', 'Sterling Academy'],
  ['37', 'Nicolás Zarur', 'M', `5'10"`, 170, 'Sophomore', 'San Diego, CA', 'St. Augustine'],
  ['38', 'Will Manix', 'F', `6'0"`, 170, 'Freshman', 'Stratham, NH', 'Exeter'],
  ['41', 'Gavin Raitt', 'D', `6'3"`, 180, 'Freshman', 'Tampa, FL', 'Wharton'],
]

const UCHICAGO_ROWS: RosterRow[] = [
  ['0', 'Josh Nimeroff', 'GK', `6'3"`, 180, 'Sophomore', 'Medford, NJ', 'Shawnee'],
  ['00', 'Ali Alamery', 'GK', `6'0"`, 185, 'Sophomore', 'East Lansing, MI', 'Michigan State'],
  ['1', 'Gabriel Diaz', 'GK', `6'3"`, 195, 'Senior', 'Pembroke Pines, FL', 'Pembroke Pines Charter'],
  ['2', 'Eli Weene', 'D', `6'1"`, 175, 'Freshman', 'Los Angeles, CA', 'Brentwood School'],
  ['3', 'Sean Cooke', 'D', `6'1"`, 170, 'Sophomore', 'Merrick, NY', 'Sanford H. Calhoun'],
  ['4', 'William Raenden', 'D', `6'4"`, 200, 'Junior', 'Nassau, Bahamas', 'Trinity College'],
  ['5', 'Alex Guo', 'M', `5'10"`, 170, 'Sophomore', 'Ann Arbor, MI', 'Skyline'],
  ['6', 'Ricky Kai', 'M', `5'10"`, 160, 'Senior', 'Houston, TX', 'Bellaire'],
  ['8', 'Edward Wu', 'M', `6'0"`, 175, 'Sophomore', 'Cary, NC', 'Green Level'],
  ['9', 'Samuel Jimenez', 'F', `6'0"`, 170, 'Sophomore', 'Atlanta, GA', 'Blessed Trinity Catholic'],
  ['10', 'David Schuster', 'F', `5'9"`, 155, 'Senior', 'Westfield, NJ', 'Seton Hall Prep'],
  ['11', 'Juan Carlos Bermudez', 'D', `5'9"`, 150, 'Sophomore', 'Los Angeles, CA', 'Loyola'],
  ['12', 'Kai Walsh', 'M', `5'9"`, 175, 'Senior', 'San Diego, CA', 'Torrey Pines'],
  ['13', 'Jedd Horowitz', 'D', `6'1"`, 180, 'Junior', 'New York City, NY', 'Fieldston'],
  ['14', 'Giovanni Caselli', 'F', `6'3"`, 185, 'Freshman', 'London, England', 'City of London School'],
  ['16', 'George Lin', 'M', `6'1"`, 180, 'Senior', 'Great Falls, VA', 'Middlesex School'],
  ['17', 'Jadyn Hsieh-Bailey', 'F', `5'9"`, 170, 'Junior', 'Oak Park, IL', 'Oak Park-River Forest'],
  ['18', 'Max Weene', 'D', `6'1"`, 175, 'Junior', 'Los Angeles, CA', 'Brentwood School'],
  ['19', 'Nick Lorr', 'D', `6'0"`, 170, 'Junior', 'Coronado, CA', 'Coronado'],
  ['20', 'Rafe Westlund', 'M', `6'0"`, 170, 'Sophomore', 'Portland, OR', 'Lincoln'],
  ['21', 'Charlie Wagner', 'M', `6'2"`, 175, 'Graduate', 'Atlanta, GA', 'Colorado College'],
  ['22', 'Evan Kanellos', 'D', `5'10"`, 170, 'Junior', 'Glenview, IL', 'New Trier Township'],
  ['24', 'Vaughn DeRath', 'D', `5'11"`, 165, 'Freshman', 'Okemos, MI', 'Northville'],
  ['25', 'Patrick Lin', 'D', `5'6"`, 150, 'Senior', 'Fremont, CA', 'Washington'],
  ['26', 'Alex Gomas', 'D', `6'2"`, 190, 'Senior', 'Atlanta, GA', 'Greater Atlanta Christian School'],
  ['27', 'William Stewart', 'M', `5'10"`, 155, 'Freshman', 'Atlanta, GA', 'The Westminster Schools'],
  ['28', 'Kevin Valdez', 'D', `6'2"`, 195, 'Senior', 'McAllen, TX', 'IDEA Toros College Prep'],
  ['30', 'Drake Wenger', 'M', `5'6"`, 150, 'Freshman', 'Jacksonville, FL', 'The Bolles School'],
  ['31', 'Chase Perry', 'F', `6'1"`, 170, 'Sophomore', 'Boone, NC', 'Davidson Day'],
  ['32', 'Ethan Peet', 'D', `6'0"`, 175, 'Sophomore', 'Chicago, IL', 'Lane Tech'],
  ['33', 'Louis Bock', 'D', `6'6"`, 200, 'Graduate', 'Niederdonven, Luxembourg', 'Coastal Carolina'],
]

const BRANDEIS_ROWS: RosterRow[] = [
  ['0', 'Adam Henry', 'GK', `6'2"`, 190, 'Graduate', 'Fort Myers, FL', ''],
  ['00', 'Sotiri Tiglianidis', 'GK', `6'0"`, 175, 'Freshman', 'Dedham, MA', ''],
  ['1', 'Benny Shin', 'GK', `5'11"`, 170, 'Junior', 'San Diego, CA', ''],
  ['2', 'Alex Karibian', 'M', `5'9"`, 155, 'Junior', 'Salem, NH', ''],
  ['3', 'Jacob Morse', 'B', `5'9"`, 160, 'Sophomore', 'Framingham, MA', ''],
  ['4', 'Kaito Shinoda', 'M', `5'7"`, 150, 'Sophomore', 'Fort Lee, NJ', ''],
  ['5', 'Dylan Marzouca', 'B', `6'3"`, 180, 'Sophomore', 'Kingston, Jamaica', ''],
  ['6', 'Juan Vera', 'M/B', `5'9"`, 160, 'Junior', 'Caracas, Venezuela', ''],
  ['7', 'Maddox Yu', 'F', `5'8"`, 155, 'Junior', 'Ridgefield, CT', ''],
  ['8', 'Charlie Culbert', 'M', `5'8"`, 155, 'Sophomore', 'Twickenham, England', ''],
  ['9', 'Elan Romo', 'F', `5'9"`, 160, 'Senior', 'Weston, FL', ''],
  ['10', 'Rainer Osselmann-Chai', 'M', `5'7"`, 150, 'Senior', 'Acton, MA', ''],
  ['11', 'Aidan Chuang', 'F', `6'0"`, 165, 'Junior', 'New York, NY', ''],
  ['13', 'Slater Loffredo', 'M', `5'9"`, 160, 'Senior', 'North Hampton, NH', ''],
  ['14', 'Yoav Feingold', 'M', `5'10"`, 160, 'Sophomore', 'Wellesley, MA', ''],
  ['15', 'Langston Byrd', 'F', `6'3"`, 180, 'Freshman', 'Austin, TX', ''],
  ['16', 'Jaiden Banton', 'F', `6'1"`, 175, 'Sophomore', 'Kingston, Jamaica', ''],
  ['17', 'Reid Etzbach', 'B', `6'1"`, 175, 'Senior', 'Wilton, CT', ''],
  ['18', 'Nico Beninda', 'M', `5'7"`, 150, 'Senior', 'Monroe Township, NJ', ''],
  ['20', 'Ben Vogelman', 'M', `5'9"`, 160, 'Junior', 'Cape Town, South Africa', ''],
  ['21', 'Josh Andrews', 'F', `5'7"`, 150, 'Senior', 'Lexington, MA', ''],
  ['22', 'Kenshin Murakawa', 'M', `6'0"`, 165, 'Junior', 'Osaka, Japan', ''],
  ['23', 'Junyeop Lee', 'B', `5'11"`, 170, 'Sophomore', 'Seoul, South Korea', ''],
  ['24', 'Aiden Melesko', 'M', `6'0"`, 165, 'Freshman', 'Manchester, CT', ''],
  ['26', 'Kaden Collins', 'B', `6'3"`, 180, 'Sophomore', 'Farmington, CT', ''],
  ['30', 'Edson Gomez-Manja', 'B', `5'10"`, 165, 'Sophomore', 'Fairfax, VA', ''],
  ['31', 'Alessio Natoli', 'B', `6'0"`, 170, 'Sophomore', 'Weston, FL', ''],
  ['32', 'Keller Chamovitz', 'F', `6'4"`, 185, 'Junior', 'Sewickley, PA', ''],
  ['99', 'Tyler Correnti', 'GK', `6'2"`, 185, 'Senior', 'West Newbury, MA', ''],
]

export const FEATURED_TEAMS: FeaturedTeamSource[] = [
  {
    meta: {
      id: 'brandeis', name: 'Brandeis Judges', school: 'Brandeis University', shortName: 'Brandeis',
      abbreviation: 'BRA', mascot: 'Judges', city: 'Waltham', state: 'MA',
      primaryColor: '#0046AD', secondaryColor: '#FFC72C', conference: 'UAA',
      defaultFormation: '4-3-3', isFeatured: true,
    },
    rows: BRANDEIS_ROWS,
  },
  {
    meta: {
      id: 'emory', name: 'Emory Eagles', school: 'Emory University', shortName: 'Emory',
      abbreviation: 'EMO', mascot: 'Eagles', city: 'Atlanta', state: 'GA',
      primaryColor: '#012169', secondaryColor: '#F2A900', conference: 'UAA',
      defaultFormation: '4-2-3-1', isFeatured: true,
    },
    rows: EMORY_ROWS,
  },
  {
    meta: {
      id: 'uchicago', name: 'Chicago Maroons', school: 'University of Chicago', shortName: 'Chicago',
      abbreviation: 'UCH', mascot: 'Maroons', city: 'Chicago', state: 'IL',
      primaryColor: '#800000', secondaryColor: '#737373', conference: 'UAA',
      defaultFormation: '4-3-3', isFeatured: true,
    },
    rows: UCHICAGO_ROWS,
  },
  {
    meta: {
      id: 'babson', name: 'Babson Beavers', school: 'Babson College', shortName: 'Babson',
      abbreviation: 'BAB', mascot: 'Beavers', city: 'Wellesley', state: 'MA',
      primaryColor: '#006B3F', secondaryColor: '#B0B7BC', conference: 'NEWMAC',
      defaultFormation: '4-4-2', isFeatured: true,
    },
    rows: BABSON_ROWS,
  },
  {
    meta: {
      id: 'suffolk', name: 'Suffolk Rams', school: 'Suffolk University', shortName: 'Suffolk',
      abbreviation: 'SUF', mascot: 'Rams', city: 'Boston', state: 'MA',
      primaryColor: '#003595', secondaryColor: '#FDB913', conference: 'CCC',
      defaultFormation: '4-3-3', isFeatured: true,
    },
    rows: SUFFOLK_ROWS,
  },
]

// Real Division III programs used to round out the league to 16 teams. Their
// rosters are generated from the name pools below.
export const FILLER_TEAMS: FillerTeamSource[] = [
  ['washu', 'WashU Bears', 'Washington University in St. Louis', 'WashU', 'WAS', 'Bears', 'St. Louis', 'MO', '#A51417', '#1C1C1C', 'UAA', '4-3-3'],
  ['nyu', 'NYU Violets', 'New York University', 'NYU', 'NYU', 'Violets', 'New York', 'NY', '#57068C', '#FFFFFF', 'UAA', '4-2-3-1'],
  ['rochester', 'Rochester Yellowjackets', 'University of Rochester', 'Rochester', 'ROC', 'Yellowjackets', 'Rochester', 'NY', '#FFD100', '#10384F', 'UAA', '4-4-2'],
  ['cwru', 'Case Western Spartans', 'Case Western Reserve University', 'Case', 'CWR', 'Spartans', 'Cleveland', 'OH', '#003C71', '#A4804D', 'UAA', '4-3-3'],
  ['cmu', 'Carnegie Mellon Tartans', 'Carnegie Mellon University', 'CMU', 'CMU', 'Tartans', 'Pittsburgh', 'PA', '#C41230', '#000000', 'UAA', '4-3-3'],
  ['tufts', 'Tufts Jumbos', 'Tufts University', 'Tufts', 'TUF', 'Jumbos', 'Medford', 'MA', '#3E8EDE', '#502D7F', 'NESCAC', '4-3-3'],
  ['amherst', 'Amherst Mammoths', 'Amherst College', 'Amherst', 'AMH', 'Mammoths', 'Amherst', 'MA', '#492C81', '#FFFFFF', 'NESCAC', '4-2-3-1'],
  ['williams', 'Williams Ephs', 'Williams College', 'Williams', 'WIL', 'Ephs', 'Williamstown', 'MA', '#4F2D7F', '#FFD200', 'NESCAC', '4-4-2'],
  ['mit', 'MIT Engineers', 'Massachusetts Institute of Technology', 'MIT', 'MIT', 'Engineers', 'Cambridge', 'MA', '#A31F34', '#8A8B8C', 'NEWMAC', '4-3-3'],
  ['middlebury', 'Middlebury Panthers', 'Middlebury College', 'Middlebury', 'MID', 'Panthers', 'Middlebury', 'VT', '#0D2C6C', '#FFFFFF', 'NESCAC', '4-3-3'],
  ['hopkins', 'Johns Hopkins Blue Jays', 'Johns Hopkins University', 'Hopkins', 'JHU', 'Blue Jays', 'Baltimore', 'MD', '#002D72', '#68ACE5', 'Centennial', '4-2-3-1'],
].map((t) => ({
  meta: {
    id: t[0], name: t[1], school: t[2], shortName: t[3], abbreviation: t[4], mascot: t[5],
    city: t[6], state: t[7], primaryColor: t[8], secondaryColor: t[9], conference: t[10],
    defaultFormation: t[11], isFeatured: false,
  },
  rosterSize: 24,
}))

// Name and hometown pools for generating filler-team rosters.
export const FIRST_NAMES = [
  'James', 'Liam', 'Noah', 'Lucas', 'Mateo', 'Diego', 'Aiden', 'Ethan', 'Owen', 'Carter',
  'Mason', 'Logan', 'Caleb', 'Ryan', 'Connor', 'Dylan', 'Gabriel', 'Julian', 'Andre', 'Marco',
  'Felix', 'Henry', 'Oscar', 'Leo', 'Tobias', 'Adrian', 'Sebastian', 'Hugo', 'Emil', 'Kai',
  'Daniel', 'Samuel', 'Nathan', 'Isaac', 'Elias', 'Theo', 'Max', 'Jonah', 'Cole', 'Brady',
  'Santiago', 'Joaquin', 'Mathias', 'Rafael', 'Andres', 'Vinicius', 'Takumi', 'Min-jun', 'Omar', 'Youssef',
]

export const LAST_NAMES = [
  'Anderson', 'Bennett', 'Carter', 'Donovan', 'Ellis', 'Foster', 'Garcia', 'Hughes', 'Ibrahim', 'Jensen',
  'Keller', 'Lawson', 'Mercer', 'Novak', 'Owens', 'Pereira', 'Quinn', 'Reyes', 'Sandoval', 'Tanaka',
  'Vargas', 'Walsh', 'Yamamoto', 'Zimmer', 'Brennan', 'Castillo', 'Delgado', 'Fischer', 'Greco', 'Holloway',
  'Iverson', 'Johansson', 'Kowalski', 'Lombardi', 'Moreau', 'Nilsson', 'Okafor', 'Petrov', 'Romano', 'Silva',
  'Thompson', 'Ueda', 'Vidal', 'Whitfield', 'Bauer', 'Costa', 'Dubois', 'Ferreira', 'Haas', 'Larsen',
]

export const HOMETOWNS: Array<[string, string]> = [
  ['Boston', 'MA'], ['New York', 'NY'], ['Chicago', 'IL'], ['Atlanta', 'GA'], ['Los Angeles', 'CA'],
  ['Denver', 'CO'], ['Seattle', 'WA'], ['Austin', 'TX'], ['Miami', 'FL'], ['Philadelphia', 'PA'],
  ['Portland', 'OR'], ['Minneapolis', 'MN'], ['San Diego', 'CA'], ['Columbus', 'OH'], ['Nashville', 'TN'],
  ['Charlotte', 'NC'], ['Pittsburgh', 'PA'], ['St. Louis', 'MO'], ['Cleveland', 'OH'], ['Baltimore', 'MD'],
]

// International hometowns used to give the global-database story texture.
export const INTL_HOMETOWNS: Array<[string, string]> = [
  ['London', 'England'], ['Madrid', 'Spain'], ['Munich', 'Germany'], ['Lyon', 'France'], ['Milan', 'Italy'],
  ['São Paulo', 'Brazil'], ['Buenos Aires', 'Argentina'], ['Tokyo', 'Japan'], ['Seoul', 'South Korea'],
  ['Amsterdam', 'Netherlands'], ['Lisbon', 'Portugal'], ['Accra', 'Ghana'], ['Mexico City', 'Mexico'],
]
