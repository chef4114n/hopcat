# HOPCAT 🐱

A fun interactive website inspired by popcat.click where users can click on a cat to make it hop! Features a global leaderboard and tracks hops per second.

## Features

- 🐱 **Interactive Cat**: Click or press SPACE to make the cat hop with smooth animations
- 📊 **Real-time Counter**: Tracks total hops and hops per second (HPS)
- 🌍 **Location-based Leaderboard**: Automatically detects your country and adds hops to your nation's total
- 🏆 **Persistent Rankings**: Global leaderboard that saves across all sessions
- 🎯 **Auto Location Detection**: Uses IP geolocation and browser location APIs
- 🎨 **Beautiful Design**: Modern gradient background with glass-morphism effects
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile devices
- 💾 **Local Storage**: Saves your progress and country automatically
- 🎵 **Sound Effects**: Optional hop sound (add your own hop.mp3 file)

## How to Use

1. Save your cat image as `hopcat.png` in the project folder
2. Open `index.html` in your web browser
3. Allow location detection when prompted (or manually select your country)
4. Click on the cat or press the SPACE key to make it hop
5. Watch your personal hop counter increase and contribute to your country's total!
6. Compete with other countries on the global leaderboard

## Files Structure

```
hopcat/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and animations
├── script.js           # JavaScript game logic
├── hopcat.png          # Your adorable cat image
├── hop.mp3             # Optional sound effect
└── README.md           # This file
```

## Customization

### Adding Your Cat Image
1. Save your cat image as `hopcat.png` in the project root directory
2. The image will automatically be used by the website
3. Recommended size: 200x200px for best results
4. Supported formats: PNG, JPG, SVG

### Adding Sound Effects
1. Add a `hop.mp3` file to the root directory
2. The game will automatically play the sound when the cat hops

## Location Detection

The website automatically detects your location using:

1. **IP Geolocation Services**: Multiple fallback services for reliability
2. **Browser Geolocation API**: GPS-based location (with permission)
3. **Manual Selection**: Country picker if automatic detection fails

### Privacy
- Location data is only used to determine your country
- No precise location data is stored or transmitted
- All data is stored locally in your browser

## Leaderboard System

- **Global Persistence**: Rankings are saved across all browser sessions
- **Real-time Updates**: Your country's total increases with each hop
- **Fair Competition**: Each browser session contributes to their detected country
- **Visual Indicators**: Your country is highlighted in the leaderboard

## Browser Support

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with animations and responsive design
- **Vanilla JavaScript**: Game logic and interactions
- **LocalStorage**: Data persistence
- **Google Fonts**: Inter font family

## License

This project is open source and available under the MIT License.

## Credits

Inspired by the original [popcat.click](https://popcat.click/) website.

---

**Have fun hopping!** 🐾
