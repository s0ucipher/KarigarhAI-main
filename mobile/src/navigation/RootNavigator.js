import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Colors } from '../theme';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RoleSelectScreen from '../screens/RoleSelectScreen';

import BuyerHome from '../screens/buyer/BuyerHome';
import Explore from '../screens/buyer/Explore';
import Search from '../screens/buyer/Search';
import CategoryResults from '../screens/buyer/CategoryResults';
import ProductDetails from '../screens/buyer/ProductDetails';
import ArtisanProfile from '../screens/buyer/ArtisanProfile';
import EnquiryCreate from '../screens/buyer/EnquiryCreate';
import Enquiries from '../screens/buyer/Enquiries';
import Cart from '../screens/buyer/Cart';
import BuyerProfile from '../screens/buyer/BuyerProfile';
import Notifications from '../screens/buyer/Notifications';
import Checkout from '../screens/buyer/Checkout';

import ArtisanHome from '../screens/artisan/ArtisanHome';
import MyProducts from '../screens/artisan/MyProducts';
import CreateProduct from '../screens/artisan/CreateProduct';
import ImageStudio from '../screens/artisan/ImageStudio';
import VoiceDescribe from '../screens/artisan/VoiceDescribe';
import CatalogueReview from '../screens/artisan/CatalogueReview';
import PriceRecommend from '../screens/artisan/PriceRecommend';
import PublishedSuccess from '../screens/artisan/PublishedSuccess';
import Dashboard from '../screens/artisan/Dashboard';
import ArtisanProfileSelf from '../screens/artisan/ArtisanProfileSelf';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabOpts = {
  headerShown: false,
  tabBarActiveTintColor: Colors.terracottaDeep,
  tabBarInactiveTintColor: Colors.muted,
  tabBarStyle: { minHeight: 64, paddingBottom: 10, paddingTop: 8, backgroundColor: '#fff' },
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
};
const emoji = (e) => ({ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 21, opacity: focused ? 1 : 0.6 }}>{e}</Text> });

function BuyerTabs() {
  return (
    <Tab.Navigator screenOptions={tabOpts}>
      <Tab.Screen name="BuyerHomeTab" component={BuyerHome} options={{ title: 'Home', ...emoji('🏠') }} />
      <Tab.Screen name="ExploreTab" component={Explore} options={{ title: 'Explore', ...emoji('🧭') }} />
      <Tab.Screen name="EnquiriesTab" component={Enquiries} options={{ title: 'Enquiries', ...emoji('💬') }} />
      <Tab.Screen name="CartTab" component={Cart} options={{ title: 'Cart', ...emoji('🧺') }} />
      <Tab.Screen name="BuyerProfileTab" component={BuyerProfile} options={{ title: 'Profile', ...emoji('👤') }} />
    </Tab.Navigator>
  );
}

function ArtisanTabs() {
  return (
    <Tab.Navigator screenOptions={tabOpts}>
      <Tab.Screen name="ArtisanHomeTab" component={ArtisanHome} options={{ title: 'Home', ...emoji('🏠') }} />
      <Tab.Screen name="MyProductsTab" component={MyProducts} options={{ title: 'My Products', ...emoji('🏺') }} />
      <Tab.Screen name="CreateTab" component={CreateProduct} options={{ title: 'Create', ...emoji('➕') }} />
      <Tab.Screen name="DashboardTab" component={Dashboard} options={{ title: 'Dashboard', ...emoji('📊') }} />
      <Tab.Screen name="ArtisanProfileTab" component={ArtisanProfileSelf} options={{ title: 'Profile', ...emoji('👤') }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="BuyerApp" component={BuyerTabs} />
      <Stack.Screen name="ArtisanApp" component={ArtisanTabs} />
      {/* Buyer stack screens */}
      <Stack.Screen name="Search" component={Search} />
      <Stack.Screen name="CategoryResults" component={CategoryResults} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} />
      <Stack.Screen name="ArtisanProfile" component={ArtisanProfile} />
      <Stack.Screen name="EnquiryCreate" component={EnquiryCreate} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="Checkout" component={Checkout} />
      {/* Artisan wizard screens */}
      <Stack.Screen name="ImageStudio" component={ImageStudio} />
      <Stack.Screen name="VoiceDescribe" component={VoiceDescribe} />
      <Stack.Screen name="CatalogueReview" component={CatalogueReview} />
      <Stack.Screen name="PriceRecommend" component={PriceRecommend} />
      <Stack.Screen name="PublishedSuccess" component={PublishedSuccess} />
    </Stack.Navigator>
  );
}
