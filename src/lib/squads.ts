// Static Premier League 2025/26 squad lists, keyed by canonical club name
// (matches PREMIER_LEAGUE_CLUBS in premier-league.ts).
// Source: official club squad pages, summer 2025. Names kept short (surname only
// where unambiguous, full name where not) to render nicely in pickers.
import { normalizeClubName } from "./premier-league";

export const SQUADS: Record<string, string[]> = {
  Arsenal: [
    "Raya", "Ramsdale", "Saliba", "Gabriel", "White", "Timber", "Calafiori",
    "Kiwior", "Tomiyasu", "Zinchenko", "Rice", "Ødegaard", "Partey", "Merino",
    "Havertz", "Trossard", "Saka", "Martinelli", "Jesus", "Nwaneri", "Sterling",
  ],
  "Aston Villa": [
    "Martínez", "Olsen", "Konsa", "Mings", "Torres", "Carlos", "Cash", "Digne",
    "Maatsen", "Onana", "Tielemans", "McGinn", "Bailey", "Rogers", "Ramsey",
    "Buendía", "Watkins", "Duran", "Asensio",
  ],
  Bournemouth: [
    "Kepa", "Travers", "Smith", "Senesi", "Kelly", "Zabarnyi", "Aarons",
    "Kerkez", "Cook", "Christie", "Scott", "Adams", "Tavernier", "Brooks",
    "Semenyo", "Kluivert", "Solanke", "Evanilson",
  ],
  Brentford: [
    "Flekken", "Valdimarsson", "Pinnock", "Collins", "Ajer", "Roerslev",
    "Lewis-Potter", "Hickey", "Janelt", "Nørgaard", "Jensen", "Damsgaard",
    "Yarmoliuk", "Mbeumo", "Wissa", "Schade", "Carvalho", "Toney",
  ],
  "Brighton & Hove Albion": [
    "Verbruggen", "Steele", "Veltman", "Webster", "Dunk", "van Hecke", "Estupiñán",
    "Lamptey", "Hinshelwood", "Gilmour", "Baleba", "Ayari", "Mitoma", "Adingra",
    "Minteh", "March", "Welbeck", "João Pedro", "Rutter",
  ],
  Burnley: [
    "Trafford", "Muric", "Roberts", "Beyer", "Esteve", "Egan-Riley", "Vitinho",
    "Taylor", "Berge", "Cullen", "Brownhill", "Mejbri", "Anthony", "Foster",
    "Rodríguez", "Flemming", "Amdouni",
  ],
  Chelsea: [
    "Sánchez", "Jörgensen", "Disasi", "Colwill", "Badiashile", "Adarabioyo",
    "Chalobah", "Gusto", "Cucurella", "James", "Caicedo", "Lavia", "Enzo",
    "Dewsbury-Hall", "Madueke", "Mudryk", "Sancho", "Palmer", "Nkunku",
    "Jackson", "João Félix",
  ],
  "Crystal Palace": [
    "Henderson", "Matthews", "Andersen", "Lacroix", "Guéhi", "Riad", "Mitchell",
    "Munoz", "Lerma", "Hughes", "Doucouré", "Wharton", "Eze", "Sarr", "Ayew",
    "Schlupp", "Mateta", "Édouard",
  ],
  Everton: [
    "Pickford", "Virgínia", "Tarkowski", "Branthwaite", "Keane", "Mykolenko",
    "Patterson", "O'Brien", "Coleman", "Garner", "Gueye", "Onana", "Doucouré",
    "Iroegbunam", "McNeil", "Harrison", "Lindstrøm", "Ndiaye", "Calvert-Lewin",
    "Beto", "Broja",
  ],
  Fulham: [
    "Leno", "Lecomte", "Bassey", "Diop", "Andersen", "Tete", "Robinson", "Castagne",
    "Berge", "Reed", "Lukić", "Pereira", "Iwobi", "Wilson", "Traoré", "Muniz",
    "Jiménez", "Smith Rowe",
  ],
  "Leeds United": [
    "Meslier", "Darlow", "Struijk", "Rodon", "Ampadu", "Cooper", "Bogle", "Firpo",
    "Byram", "Gruev", "Tanaka", "Stach", "Aaronson", "James", "Summerville",
    "Piroe", "Joseph", "Solomon",
  ],
  Liverpool: [
    "Alisson", "Kelleher", "Van Dijk", "Konaté", "Gomez", "Quansah", "Alexander-Arnold",
    "Robertson", "Tsimikas", "Bradley", "Mac Allister", "Szoboszlai", "Endo",
    "Jones", "Gravenberch", "Salah", "Díaz", "Núñez", "Gakpo", "Jota", "Chiesa",
  ],
  "Manchester City": [
    "Ederson", "Ortega", "Stones", "Dias", "Akanji", "Aké", "Gvardiol", "Walker",
    "Lewis", "Rodri", "Kovačić", "De Bruyne", "Bernardo", "Foden", "Gündoğan",
    "Doku", "Grealish", "Savinho", "Haaland", "Álvarez",
  ],
  "Manchester United": [
    "Onana", "Bayındır", "Maguire", "Martínez", "De Ligt", "Yoro", "Mazraoui",
    "Dalot", "Shaw", "Malacia", "Mainoo", "Casemiro", "Eriksen", "Ugarte",
    "Mount", "Bruno Fernandes", "Antony", "Garnacho", "Rashford", "Højlund",
    "Zirkzee",
  ],
  "Newcastle United": [
    "Pope", "Dúbravka", "Trippier", "Burn", "Schär", "Botman", "Lascelles",
    "Hall", "Livramento", "Krafth", "Bruno Guimarães", "Tonali", "Joelinton",
    "Longstaff", "Miley", "Almirón", "Murphy", "Gordon", "Barnes", "Isak",
    "Wilson",
  ],
  "Nottingham Forest": [
    "Sels", "Vlachodimos", "Murillo", "Milenković", "Boly", "Aina", "Williams",
    "Toffolo", "Yates", "Domínguez", "Anderson", "Sangaré", "Gibbs-White",
    "Elanga", "Hudson-Odoi", "Awoniyi", "Wood", "Origi",
  ],
  Sunderland: [
    "Patterson", "Ballard", "Mepham", "O'Nien", "Cirkin", "Hume", "Neil",
    "Bellingham", "Rigg", "Roberts", "Clarke", "Mayenda", "Watson", "Mundle",
    "Isidor", "Stewart",
  ],
  "Tottenham Hotspur": [
    "Vicario", "Forster", "Romero", "Van de Ven", "Davies", "Dragusin", "Porro",
    "Udogie", "Spence", "Bissouma", "Sarr", "Bentancur", "Maddison", "Kulusevski",
    "Johnson", "Son", "Werner", "Solanke", "Richarlison",
  ],
  "West Ham United": [
    "Areola", "Fabianski", "Mavropanos", "Kilman", "Todibo", "Aguerd", "Coufal",
    "Emerson", "Cresswell", "Wan-Bissaka", "Soucek", "Álvarez", "Ward-Prowse",
    "Rodríguez", "Paquetá", "Bowen", "Kudus", "Antonio", "Füllkrug",
  ],
  "Wolverhampton Wanderers": [
    "Sá", "Bentley", "Doherty", "Toti", "Dawson", "Bueno", "Kilman", "Ait-Nouri",
    "Semedo", "Lemina", "Gomes", "André", "Bellegarde", "Cunha", "Sarabia",
    "Larsen", "Strand Larsen", "H. Hwang",
  ],
};

export const squadFor = (club: string): string[] => {
  const canon = normalizeClubName(club);
  return SQUADS[canon] ?? [];
};
