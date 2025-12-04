import { ClassSection, Student } from './types';

// Mock Teachers List (Initials)
export const MOCK_TEACHERS = [
  'SGM', 'RJ', 'OKT', 'SRL', 'LYT', 'SKM', 'MDN', 'ETA', 'SYB', 'VDR', 
  'KR', 'AJS', 'NVP', 'SMA', 'CDS', 'KSK', 'KCK', 'ALB', 'VC', 'AMC', 
  'SPC', 'KYV', 'DSS', 'CHI', 'AJM', 'AKY', 'EAK'
];

// MYP 1 A (Combined)
const MYP1A_STUDENTS: Student[] = [
  { id: '8304', rollNumber: 8304, name: 'GUTHI PRAGNYA' },
  { id: '8181', rollNumber: 8181, name: 'V KRISHIYEAH' },
  { id: '8133', rollNumber: 8133, name: 'MIRUDULLA SAI MAHESH' },
  { id: '8087', rollNumber: 8087, name: 'VARADA KAUL' },
  { id: '8442', rollNumber: 8442, name: 'VEERA RAVI SUTARIYA' },
  { id: '8456', rollNumber: 8456, name: 'NITHISH CHOWDARY GURAJALA' },
  { id: '8451', rollNumber: 8451, name: 'DHRUSHIL VIRAL SHAH' },
  { id: '8325', rollNumber: 8325, name: 'MOHAMMAD REHAN SHAREEF' },
  { id: '8088', rollNumber: 8088, name: 'VIVAAN KAUL' },
  { id: '8056', rollNumber: 8056, name: 'KAKARLA RANGA PRABHANJAN' },
  { id: '8471', rollNumber: 8471, name: 'SAMANYU GALI' },
  { id: '8479', rollNumber: 8479, name: 'SOLANKI MIHIR MINESHBHAI' },
  { id: '8488', rollNumber: 8488, name: 'JENISH SIDDHARTH PATEL' },
  { id: '7972', rollNumber: 7972, name: 'ANAISHA CHORDIA' },
  { id: '7955', rollNumber: 7955, name: 'THANEEKSHA GOWDA R' },
  { id: '7831', rollNumber: 7831, name: 'INAAYA DINA RAWTHAR' },
  { id: '7782', rollNumber: 7782, name: 'ZURI AMRISH PATEL' },
  { id: '7731', rollNumber: 7731, name: 'ITHAL INEYA L S' },
  { id: '8411', rollNumber: 8411, name: 'VIHAN ASHISHBHAI MARVANIYA' },
  { id: '8408', rollNumber: 8408, name: 'KHUSH HARDIK PATEL' },
  { id: '8015', rollNumber: 8015, name: 'SHIVAN RAJ DHOLAKIA' },
  { id: '7756', rollNumber: 7756, name: 'HET HITESHBHAI BHARVAD' },
  { id: '7755', rollNumber: 7755, name: 'ADITH ARADHYA' }
];

// MYP 2 A
const MYP2A_STUDENTS: Student[] = [
  { id: '8422', rollNumber: 8422, name: 'ANAAYA PODDAR' },
  { id: '7698', rollNumber: 7698, name: 'AVNI SAMRA' },
  { id: '8149', rollNumber: 8149, name: 'PRISHA RAHUL MANGUKIYA' },
  { id: '8003', rollNumber: 8003, name: 'PRADHAKSHANAA RAJESHKUMAR' },
  { id: '7979', rollNumber: 7979, name: 'VISHWARJUNA DAYANENI' },
  { id: '7641', rollNumber: 7641, name: 'JOHAN MATHEW SHAREEN' },
  { id: '8211', rollNumber: 8211, name: 'ARYAN AGARWAL' },
  { id: '8213', rollNumber: 8213, name: 'HENIL AMRUTIYA' },
  { id: '8299', rollNumber: 8299, name: 'RIKITH PACHIPULA' },
  { id: '8072', rollNumber: 8072, name: 'KUNDULA KRISHNA SASIDHAR' },
  { id: '8287', rollNumber: 8287, name: 'GOWTHAM SELVAM' },
  { id: '8452', rollNumber: 8452, name: 'AARUSH BODHAASU' },
  { id: '8449', rollNumber: 8449, name: 'YUVRAJ . SAHU' }
];

// MYP 2 B
const MYP2B_STUDENTS: Student[] = [
  { id: '7952', rollNumber: 7952, name: 'YASHI JALAN' },
  { id: '7960', rollNumber: 7960, name: 'NEERAJA NAYANI .' },
  { id: '7909', rollNumber: 7909, name: 'SAI VENKAT SHREYASH RAVURI' },
  { id: '8032', rollNumber: 8032, name: 'AYRA ASHISH LAKHANI' },
  { id: '8336', rollNumber: 8336, name: 'SANAVI BARMAN' },
  { id: '8010', rollNumber: 8010, name: 'PRANEETH GUTHI' },
  { id: '8090', rollNumber: 8090, name: 'DIVYAM AGARWAL' },
  { id: '8101', rollNumber: 8101, name: 'S LACSHIT NAARAYANAN' },
  { id: '8113', rollNumber: 8113, name: 'SHIV RAMCHANDRA SADIGALE' },
  { id: '8410', rollNumber: 8410, name: 'AVYAAN KEDIA' },
  { id: '8401', rollNumber: 8401, name: 'HARDIK MAHESHWARI' },
  { id: '8371', rollNumber: 8371, name: 'YOHAN CHINTAN RIBADIA' }
];

// MYP 3 A
const MYP3A_STUDENTS: Student[] = [
  { id: '7956', rollNumber: 7956, name: 'SAANVI RAKESH' },
  { id: '8136', rollNumber: 8136, name: 'GRIHITHA SRINIVAS GOWDA' },
  { id: '8460', rollNumber: 8460, name: 'PAVANA KSHEMAMKARI MATTUPALLI' },
  { id: '8440', rollNumber: 8440, name: 'MIRAYA ANUJ MEHTA' },
  { id: '8331', rollNumber: 8331, name: 'MILIT NEERAJ SRIVASTAVA' },
  { id: '8326', rollNumber: 8326, name: 'ALEX PARESH BAVALIYA' },
  { id: '7966', rollNumber: 7966, name: 'VIRAT SAI M' },
  { id: '8178', rollNumber: 8178, name: 'NIRVAAN JAIN' },
  { id: '8431', rollNumber: 8431, name: 'AMAANULLAH KHAN' },
  { id: '8478', rollNumber: 8478, name: 'NISHIKA JUNEJA' },
  { id: '8500', rollNumber: 8500, name: 'KRISHNA REDDY TEEGALA' },
  { id: '8392', rollNumber: 8392, name: 'DHRUV PRANAV GANDHI' },
  { id: '8395', rollNumber: 8395, name: 'KRISHIV AMISH MEHTA' },
  { id: '8496', rollNumber: 8496, name: 'JAS DHIRAJ DARYANI' },
  { id: '8472', rollNumber: 8472, name: 'SIYA KIRAN GALI' },
  { id: '8367', rollNumber: 8367, name: 'AVEKA AGARWAL' },
  { id: '8084', rollNumber: 8084, name: 'NEEV NIRAV PATEL' }
];

// MYP 3 B
const MYP3B_STUDENTS: Student[] = [
  { id: '7949', rollNumber: 7949, name: 'ADITI SANTRA' },
  { id: '8064', rollNumber: 8064, name: 'KAKARLA RANGA YASHASWINI' },
  { id: '7769', rollNumber: 7769, name: 'ESHITHA SEELAM' },
  { id: '8407', rollNumber: 8407, name: 'KAYRA SARVESH SALVI CHAVAN' },
  { id: '8378', rollNumber: 8378, name: 'SUKRITI SARASWAT' },
  { id: '8270', rollNumber: 8270, name: 'AADHEESH PATEL' },
  { id: '8135', rollNumber: 8135, name: 'ARNAV SRI PENUMUTCHU' },
  { id: '7939', rollNumber: 7939, name: 'RYANN FRANCY' },
  { id: '7560', rollNumber: 7560, name: 'TEJESWAR' },
  { id: '8165', rollNumber: 8165, name: 'AARAV SIPANI' },
  { id: '7749', rollNumber: 7749, name: 'ARNAV V' },
  { id: '8426', rollNumber: 8426, name: 'MITHILESH GOKUL DUSANE' },
  { id: '8402', rollNumber: 8402, name: 'JOHAN DALSANIYA' },
  { id: '8477', rollNumber: 8477, name: 'GAURANGI BHANOT' },
  { id: '8494', rollNumber: 8494, name: 'REYANSH JIWANI' }
];

// MYP 3 C
const MYP3C_STUDENTS: Student[] = [
  { id: '8191', rollNumber: 8191, name: 'JILAY HITESH SARDHARA' },
  { id: '8199', rollNumber: 8199, name: 'JAIVARDHAN AGARWALLA' },
  { id: '8216', rollNumber: 8216, name: 'AARYAN DENISH KANSAGARA' },
  { id: '7572', rollNumber: 7572, name: 'AKHILESSH CHILAKAMARRI' },
  { id: '7767', rollNumber: 7767, name: 'VIVAAN SANGILIRAJ' },
  { id: '8079', rollNumber: 8079, name: 'SAI SMARAN' },
  { id: '7337', rollNumber: 7337, name: 'YAJ SUNIT PATEL' },
  { id: '8294', rollNumber: 8294, name: 'HARSHIL BANKIMBHAI MEHTA' },
  { id: '8138', rollNumber: 8138, name: 'ZAYAAN FARIYA MANSURI' },
  { id: '7863', rollNumber: 7863, name: 'ANANT SINGH ARORA' },
  { id: '8237', rollNumber: 8237, name: 'SAMAR AGRAWAL' },
  { id: '8282', rollNumber: 8282, name: 'SHAAN BHUSHANBHAI SAKHIYA' },
  { id: '8277', rollNumber: 8277, name: 'VIAANN BRIJESH PATEL' },
  { id: '8370', rollNumber: 8370, name: 'ARYAMAN KOTADIYA' },
  { id: '8046', rollNumber: 8046, name: 'NEEL BHAVESHBHAI KATHROTIYA' },
  { id: '8193', rollNumber: 8193, name: 'PRATHAM AMISH CHANDARANA' },
  { id: '7889', rollNumber: 7889, name: 'YAKKSHH MIRANI' }
];

// MYP 4 A
const MYP4A_STUDENTS: Student[] = [
  { id: '8185', rollNumber: 8185, name: 'AARNAVI REKHA APPASANI' },
  { id: '7632', rollNumber: 7632, name: 'SAACHI AGARWAL' },
  { id: '7987', rollNumber: 7987, name: 'SANVI SAJAY' },
  { id: '8108', rollNumber: 8108, name: 'DIVA ADESHRA' },
  { id: '8217', rollNumber: 8217, name: 'AASMAA MITESH GAJERA' },
  { id: '8038', rollNumber: 8038, name: 'LAKSHMI KEERTHANA' },
  { id: '7737', rollNumber: 7737, name: 'TIARA AGARWAL' },
  { id: '7825', rollNumber: 7825, name: 'SHOURYA RAHUL MANE' },
  { id: '7973', rollNumber: 7973, name: 'PRANAV GOBINATH' },
  { id: '7490', rollNumber: 7490, name: 'KULDIP DUBISHETTY' },
  { id: '8283', rollNumber: 8283, name: 'RUDRA SAKHIYA' },
  { id: '8164', rollNumber: 8164, name: 'AKSHAJ VELLORE' },
  { id: '8389', rollNumber: 8389, name: 'RUDRANSH VIVEK GANDHI' },
  { id: '8499', rollNumber: 8499, name: 'NAINESHA REDDY GUNREDDY' },
  { id: '8501', rollNumber: 8501, name: 'VIREN KRISHNA ADUSUMILLI' }
];

// MYP 4 B
const MYP4B_STUDENTS: Student[] = [
  { id: '7336', rollNumber: 7336, name: 'SAANVI SUNIT PATEL' },
  { id: '7789', rollNumber: 7789, name: 'VIDUSSHI JAIN' },
  { id: '8162', rollNumber: 8162, name: 'VAIDEHI ANAND' },
  { id: '7839', rollNumber: 7839, name: 'SAI SIDDHIKSHA SAKHAMURI' },
  { id: '8024', rollNumber: 8024, name: 'ANAYA CHOKSI' },
  { id: '8218', rollNumber: 8218, name: 'NINA ASHWIN GANDHI' },
  { id: '8446', rollNumber: 8446, name: 'JINANSHI JAIN' },
  { id: '8132', rollNumber: 8132, name: 'ANAV SINGH BHATIA' },
  { id: '8168', rollNumber: 8168, name: 'SIDDHANT AKSHAY VASOYA' },
  { id: '7645', rollNumber: 7645, name: 'YADHAVAR BABU' },
  { id: '7976', rollNumber: 7976, name: 'SATVIK AGRAWAL' },
  { id: '7588', rollNumber: 7588, name: 'ARNAV SAMRA' },
  { id: '8223', rollNumber: 8223, name: 'DEV DARSHAN KARIA' },
  { id: '8157', rollNumber: 8157, name: 'YOGI DHARMESH KAKADIA' }
];

// MYP 5 A (Combined)
const MYP5A_STUDENTS: Student[] = [
  { id: '8102', rollNumber: 8102, name: 'AE DHANYA ELANGOVAN' },
  { id: '8098', rollNumber: 8098, name: 'ARADHANA MURALIKRISHNAN' },
  { id: '8018', rollNumber: 8018, name: 'NIKITHA REDDY' },
  { id: '8091', rollNumber: 8091, name: 'ANANYA SUHANE' },
  { id: '8338', rollNumber: 8338, name: 'TEJASWINI RAMALINGAM' },
  { id: '8303', rollNumber: 8303, name: 'MOKSHA NALEEN PATEL' },
  { id: '7891', rollNumber: 7891, name: 'DHARMI SARDHARA' },
  { id: '7840', rollNumber: 7840, name: 'FIONA HARDIK PATEL' },
  { id: '7868', rollNumber: 7868, name: 'AAGAM LUNAWAT' },
  { id: '7892', rollNumber: 7892, name: 'JENIL SARDHARA' },
  { id: '7995', rollNumber: 7995, name: 'DHRUV PATEL' },
  { id: '8151', rollNumber: 8151, name: 'AKARSH GOYAL' },
  { id: '8187', rollNumber: 8187, name: 'DIVYE MITTAL' },
  { id: '7774', rollNumber: 7774, name: 'RUMAISHA ALAM KHAN' },
  { id: '8328', rollNumber: 8328, name: 'DHRUVI AGARWAL' },
  { id: '7730', rollNumber: 7730, name: 'ADITYA JAIN' },
  { id: '7764', rollNumber: 7764, name: 'SAYAAN PATEL' },
  { id: '7768', rollNumber: 7768, name: 'PRAJWAL SAHOO' },
  { id: '7978', rollNumber: 7978, name: 'PARTHIV SORATHIYA' },
  { id: '8141', rollNumber: 8141, name: 'JAIVIN THUMMAR' },
  { id: '7822', rollNumber: 7822, name: 'PRANSHU DOSHI' }
];

export const MYP_CLASSES: ClassSection[] = [
  { id: 'myp1-a', grade: 'MYP 1', section: 'A', students: MYP1A_STUDENTS },
  { id: 'myp2-a', grade: 'MYP 2', section: 'A', students: MYP2A_STUDENTS },
  { id: 'myp2-b', grade: 'MYP 2', section: 'B', students: MYP2B_STUDENTS },
  { id: 'myp3-a', grade: 'MYP 3', section: 'A', students: MYP3A_STUDENTS },
  { id: 'myp3-b', grade: 'MYP 3', section: 'B', students: MYP3B_STUDENTS },
  { id: 'myp3-c', grade: 'MYP 3', section: 'C', students: MYP3C_STUDENTS },
  { id: 'myp4-a', grade: 'MYP 4', section: 'A', students: MYP4A_STUDENTS },
  { id: 'myp4-b', grade: 'MYP 4', section: 'B', students: MYP4B_STUDENTS },
  { id: 'myp5-a', grade: 'MYP 5', section: 'A', students: MYP5A_STUDENTS },
];