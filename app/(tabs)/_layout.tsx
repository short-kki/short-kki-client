import { Tabs } from "expo-router";
import { View } from "react-native";
import { Home, Search, Calendar, User } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF6B00",
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopWidth: 0,
          height: 85,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`p-1 rounded-lg ${
                focused ? "bg-orange-500/10" : "bg-transparent"
              }`}
            >
              <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "탐색",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`p-1 rounded-lg ${
                focused ? "bg-orange-500/10" : "bg-transparent"
              }`}
            >
              <Search size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "식단",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`p-1 rounded-lg ${
                focused ? "bg-orange-500/10" : "bg-transparent"
              }`}
            >
              <Calendar
                size={24}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`p-1 rounded-lg ${
                focused ? "bg-orange-500/10" : "bg-transparent"
              }`}
            >
              <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
