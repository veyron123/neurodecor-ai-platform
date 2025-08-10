// Application constants
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3007';

export const ROOM_TYPES = {
  'bedroom': 'Спальня',
  'living-room': 'Гостиная', 
  'kitchen': 'Кухня',
  'dining-room': 'Столовая',
  'bathroom': 'Ванная',
  'home-office': 'Домашний офис'
};

export const FURNITURE_STYLES = {
  'scandinavian': 'Скандинавский',
  'modern': 'Современный',
  'minimalist': 'Минималистичный', 
  'coastal': 'Прибрежный',
  'industrial': 'Индустриальный',
  'traditional': 'Традиционный'
};

export const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB