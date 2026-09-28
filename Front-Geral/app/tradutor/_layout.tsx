import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { getCurrentEmployee, logout } from '@/services/auth';
import type { Employee } from '@/services/employees';

import {
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

function CustomDrawerContent(props: any) {
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    void getCurrentEmployee()
      .then(setEmployee)
      .catch(() => setEmployee(null));
  }, []);

  async function deslogar() {
    await logout();
    router.replace('/');
  }


  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContent}
    >

    <View>

        <Text style={styles.titulo}>
            Menu Tradutor
        </Text>

        {employee?.role === 'freelancer' &&
          employee.status === 'available' && (
            <DrawerItem
            label="Serviços"
            onPress={() =>
            router.push('/tradutor/servicos')
            }
            labelStyle={styles.label}
            />
        )}

    </View>


      <View style={styles.rodape}>

        <DrawerItem
          label="Deslogar"
          onPress={() => void deslogar()}
          labelStyle={styles.deslogar}
        />

      </View>

    </DrawerContentScrollView>
  );
}


export default function TradutorLayout() {

  return (
    <Drawer
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}

      screenOptions={{
        drawerStyle: {
          backgroundColor: '#000',
          width: 280,
        },

        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#aaa',

        headerStyle: {
          backgroundColor: '#000',
        },

        headerTintColor: '#fff',
      }}
    >

      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: {
            display: 'none',
          },

          title: 'Área do Tradutor',
        }}
      />


      <Drawer.Screen
        name="completar-perfil"
        options={{
          title: 'Completar Perfil',

          drawerItemStyle: {
            display: 'none',
          },
        }}
      />


      <Drawer.Screen
        name="servicos"
        options={{
          drawerLabel: 'Serviços',
          title: 'Serviços',
        }}
      />

    </Drawer>
  );
}


const styles = StyleSheet.create({

  drawerContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  titulo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },

  label: {
    color: '#fff',
    fontSize: 16,
  },

  rodape: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
    paddingBottom: 10,
  },

  deslogar: {
    color: '#ff5555',
    fontSize: 16,
    fontWeight: 'bold',
  },

});