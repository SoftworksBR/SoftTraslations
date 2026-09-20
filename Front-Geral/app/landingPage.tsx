import { router } from 'expo-router';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    Image,
} from 'react-native';

export default function LandingPage() {
    return (
        <ScrollView style={styles.container}>

            {/* HERO */}
            <View style={styles.hero}>

                {/* TOPO */}
                <View style={styles.heroTop}>

                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>
                            SoftTranslations
                        </Text>
                    </View>

                    <View style={styles.navLinks}>

                        <Text style={styles.navLink}>
                            Recursos
                        </Text>

                        <Pressable onPress={() => router.push('/login')}>
                            <Text style={styles.navLink}>
                                Entrar
                            </Text>
                        </Pressable>

                    </View>

                </View>

                {/* CONTEÚDO DO HERO */}
                <View style={styles.heroContent}>

                    {/* INFORMAÇÕES */}
                    <View style={styles.heroInfo}>

                        <Text style={styles.heroLabel}>
                            GESTÃO DE TRADUÇÕES
                        </Text>

                        <Text style={styles.heroTitle}>
                            Traduções organizadas.{'\n'}
                            Projetos sob controle.
                        </Text>

                        <Text style={styles.heroSubtitle}>
                            Centralize clientes, equipes, orçamentos e projetos
                            em um único ambiente, facilitando o acompanhamento
                            de cada tradução do início à entrega.
                        </Text>

                        <Pressable
                            style={styles.ctaButton}
                            onPress={() => router.push('/login')}
                        >
                            <Text style={styles.ctaText}>
                                COMEÇAR AGORA
                            </Text>
                        </Pressable>

                    </View>

                    {/* LOGO */}
                    <View style={styles.heroLogoContainer}>

                        <Image
                            source={require('../assets/images/logo.png')}
                            style={styles.heroLogo}
                            resizeMode="contain"
                        />

                    </View>

                </View>

            </View>

            {/* RECURSOS */}
            <View style={styles.resourcesSection}>
                {/* CARDS */}
                <View style={styles.resourcesGrid}>

                    {/* CARD 01 */}
                    <Pressable
                        style={({ hovered }) => [
                            styles.resourceCard,
                            hovered && styles.resourceCardHover,
                        ]}
                    >
                        <Text style={styles.resourceNumber}>
                            01
                        </Text>

                        <Text style={styles.resourceTitle}>
                            Projetos organizados
                        </Text>

                        <Text style={styles.resourceDescription}>
                            Crie novos projetos, organize as informações e acompanhe
                            o andamento de cada tradução em um único lugar.
                        </Text>
                    </Pressable>

                    {/* CARD 02 */}
                    <Pressable
                        style={({ hovered }) => [
                            styles.resourceCard,
                            hovered && styles.resourceCardHover,
                        ]}
                    >
                        <Text style={styles.resourceNumber}>
                            02
                        </Text>

                        <Text style={styles.resourceTitle}>
                            Gestão de equipe
                        </Text>

                        <Text style={styles.resourceDescription}>
                            Organize gestores, atendentes e tradutores, definindo
                            responsabilidades de acordo com cada projeto.
                        </Text>
                    </Pressable>

                    {/* CARD 03 */}
                    <Pressable
                        style={({ hovered }) => [
                            styles.resourceCard,
                            hovered && styles.resourceCardHover,
                        ]}
                    >
                        <Text style={styles.resourceNumber}>
                            03
                        </Text>

                        <Text style={styles.resourceTitle}>
                            Etapas e prazos
                        </Text>

                        <Text style={styles.resourceDescription}>
                            Acompanhe as etapas do trabalho, os responsáveis e os
                            prazos para manter cada projeto dentro do cronograma.
                        </Text>
                    </Pressable>

                    {/* CARD 04 */}
                    <Pressable
                        style={({ hovered }) => [
                            styles.resourceCard,
                            hovered && styles.resourceCardHover,
                        ]}
                    >
                        <Text style={styles.resourceNumber}>
                            04
                        </Text>

                        <Text style={styles.resourceTitle}>
                            Clientes centralizados
                        </Text>

                        <Text style={styles.resourceDescription}>
                            Mantenha empresas, contatos, solicitações e histórico
                            dos clientes reunidos em um único ambiente.
                        </Text>
                    </Pressable>

                    {/* CARD 05 */}
                    <Pressable
                        style={({ hovered }) => [
                            styles.resourceCard,
                            hovered && styles.resourceCardHover,
                        ]}
                    >
                        <Text style={styles.resourceNumber}>
                            05
                        </Text>

                        <Text style={styles.resourceTitle}>
                            Orçamentos e serviços
                        </Text>

                        <Text style={styles.resourceDescription}>
                            Crie e consulte orçamentos, registre os serviços
                            solicitados e acompanhe cada negociação.
                        </Text>
                    </Pressable>

                    {/* CARD 06 */}
                    <Pressable
                        style={({ hovered }) => [
                            styles.resourceCard,
                            hovered && styles.resourceCardHover,
                        ]}
                    >
                        <Text style={styles.resourceNumber}>
                            06
                        </Text>

                        <Text style={styles.resourceTitle}>
                            Acompanhamento do projeto
                        </Text>

                        <Text style={styles.resourceDescription}>
                            Consulte o status, as entregas e o andamento de cada
                            projeto para saber exatamente o que está acontecendo.
                        </Text>
                    </Pressable>

                </View>

            </View>

            {/* RODAPÉ */}
            <View style={styles.footer}>

                <Pressable
                    style={styles.loginButton}
                    onPress={() => router.push('/login')}
                >
                    <Text style={styles.loginText}>
                        ENTRAR NA PLATAFORMA
                    </Text>
                </Pressable>

            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({

    /* CONTAINER */
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    /* HERO */
    hero: {
        backgroundColor: '#000000',
    },

    /* TOPO */
    heroTop: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 10,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    logo: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },

    /* LINKS */
    navLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },

    navLink: {
        color: '#AAAAAA',
        fontSize: 13,
        fontWeight: '600',
    },

    /* CONTEÚDO DO HERO */
    heroContent: {
        paddingHorizontal: 40,
        paddingTop: 45,
        paddingBottom: 55,

        flexDirection: 'row',
        alignItems: 'center',
    },

    heroInfo: {
        width: '50%',
        paddingRight: 30,
        marginLeft: 25,
    },

    heroLabel: {
        color: '#888888',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 14,
    },

    heroTitle: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '800',
        lineHeight: 39,
        marginBottom: 16,
    },

    heroSubtitle: {
        color: '#999999',
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 26,
        maxWidth: 500,
    },

    /* BOTÃO PRINCIPAL */
    ctaButton: {
        alignSelf: 'flex-start',

        paddingHorizontal: 26,
        paddingVertical: 11,

        backgroundColor: '#FFFFFF',
        borderRadius: 6,
    },

    ctaText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#000000',
    },

    /* LOGO */
    heroLogoContainer: {
        width: '50%',
        height: 350,

        alignItems: 'center',
        justifyContent: 'center',

        marginLeft: -150,
    },

    heroLogo: {
        width: '100%',
        height: '100%',
    },

    /* SEÇÃO DE RECURSOS */
    resourcesSection: {
        backgroundColor: '#FFFFFF',
    },

    /* CABEÇALHO DOS RECURSOS */
    resourcesHeader: {
        backgroundColor: '#000000',

        paddingHorizontal: 24,
        paddingTop: 55,
        paddingBottom: 45,
    },

    resourcesLabel: {
        color: '#888888',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 12,
    },

    resourcesTitle: {
        color: '#FFFFFF',
        fontSize: 29,
        fontWeight: '800',
        lineHeight: 36,
        maxWidth: 800,
    },

    /* GRID */
    resourcesGrid: {
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 40,

        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',

        rowGap: 16,
    },

    /* CARD */
    resourceCard: {
        width: '31.5%',
        height: 160,

        backgroundColor: '#FFFFFF',

        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 14,

        padding: 16,

        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.07,
        shadowRadius: 6,

        elevation: 2,

        transitionDuration: '200ms',
    },

    /* CARD AO PASSAR O MOUSE */
    resourceCardHover: {
        backgroundColor: '#F5F5F5',

        borderColor: '#000000',

        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.15,
        shadowRadius: 10,

        elevation: 6,

        transform: [
            {
                translateY: -4,
            },
        ],
    },

    /* NÚMERO */
    resourceNumber: {
        color: '#999999',
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 12,
    },

    /* TÍTULO DOS CARDS */
    resourceTitle: {
        color: '#000000',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 18,
        marginBottom: 7,
    },

    /* DESCRIÇÃO DOS CARDS */
    resourceDescription: {
        color: '#777777',
        fontSize: 11,
        lineHeight: 16,
    },

    /* RODAPÉ */
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 40,

        backgroundColor: '#F5F5F5',

        alignItems: 'center',
    },

    loginButton: {
        width: '100%',
        height: 50,

        justifyContent: 'center',
        alignItems: 'center',

        backgroundColor: '#000000',
        borderRadius: 6,
    },

    loginText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },

});

