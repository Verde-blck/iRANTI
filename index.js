import './global.css';
import { AppRegistry } from 'react-native';
import App from './App';
import AlarmApp from './src/AlarmApp';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('IrantiAlarm', () => AlarmApp);
