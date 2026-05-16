import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import MenuScreen from './screens/MenuScreen';
import LoyaltyScreen from './screens/LoyaltyScreen';
import OwnerDashboard from './screens/OwnerDashboard';
import MenuManager from './screens/MenuManager';
import CartScreen from './screens/CartScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#faf7f2',
          borderTopColor: '#e0d5c5',
          paddingBottom: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#5c3317',
        tabBarInactiveTintColor: '#8b5a2b',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Menu') iconName = focused ? 'cafe' : 'cafe-outline';
          else if (route.name === 'Loyalty') iconName = focused ? 'card' : 'card-outline';
          else if (route.name === 'Owner') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Loyalty" component={LoyaltyScreen} />
      <Tab.Screen name="Owner" component={OwnerDashboard} />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={CustomerTabs} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="MenuManager" component={MenuManager} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
}