import { Tabs } from "expo-router";
import { View, Pressable } from "react-native";
import { Home, CalendarDays, Plus, BookOpen, Users } from "lucide-react-native";
import { Colors } from "@/constants/design-system";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.neutral[400],
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[100],
          height: 85,
          paddingTop: 10,
          paddingBottom: 20,
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
              style={{
                padding: 4,
                borderRadius: 8,
                backgroundColor: focused ? `${Colors.primary[500]}15` : "transparent",
              }}
            >
              <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: "식단표",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                padding: 4,
                borderRadius: 8,
                backgroundColor: focused ? `${Colors.primary[500]}15` : "transparent",
              }}
            >
              <CalendarDays size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: Colors.primary[500],
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
                shadowColor: Colors.primary[500],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="recipe-book"
        options={{
          title: "레시피북",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                padding: 4,
                borderRadius: 8,
                backgroundColor: focused ? `${Colors.primary[500]}15` : "transparent",
              }}
            >
              <BookOpen size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: "그룹",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                padding: 4,
                borderRadius: 8,
                backgroundColor: focused ? `${Colors.primary[500]}15` : "transparent",
              }}
            >
              <Users size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      {/* Hidden screens - accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="shorts"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
