import { router } from 'expo-router';

import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    useWindowDimensions,
    type DimensionValue,
} from 'react-native';

export default function LandingPage() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    let cardWidth: DimensionValue;

    if (isMobile) {
        cardWidth = '100%';
    } else if (isTablet) {
        cardWidth = '48%';
    } else {
        cardWidth = '31.5%';
    }

    const cards = [
        {
            number: '01',
            title: 'Requisições de clientes',
            description:
                'Receba e gerencie solicitações de tradução dos clientes em um só lugar, organizando todas as demandas.',
        },
        {
            number: '02',
            title: 'Orçamentos',
            description:
                'Crie, analise e acompanhe orçamentos. Aprove ou rejeite solicitações com facilidade.',
        },
        {
            number: '03',
            title: 'Gestão de tradutores',
            description:
                'Aloque tradutores para projetos, acompanhe o progresso e gerencie prazos de entrega.',
        },
        {
            number: '04',
            title: 'Clientes centralizados',
            description:
                'Mantenha informações de clientes, histórico de projetos e comunicações em um único local.',
        },
        {
            number: '05',
            title: 'Acompanhamento de projetos',
            description:
                'Monitore o status de cada tradução, etapas concluídas e pendências em tempo real.',
        },
        {
            number: '06',
            title: 'Relatórios e analytics',
            description:
                'Gere relatórios detalhados sobre projetos, receita e desempenho da equipe.',
        },
    ];

    return (
        <ScrollView style={styles.container}>

            {/* HERO */}
            <View style={styles.hero}>

                {/* TOPO */}
                <View
                    style={[
                        styles.heroTop,
                        {
                            paddingHorizontal: isMobile ? 16 : 24,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.logo,
                            {
                                fontSize: isMobile ? 14 : 16,
                            },
                        ]}
                    >
                        SoftTranslations
                    </Text>

                    <Pressable onPress={() => router.push('/login')}>
                        <Text
                            style={[
                                styles.navLink,
                                {
                                    fontSize: isMobile ? 12 : 13,
                                },
                            ]}
                        >
                            Login
                        </Text>
                    </Pressable>
                </View>

                {/* CONTEÚDO DO HERO */}
                <View
                    style={[
                        styles.heroContent,
                        {
                            paddingHorizontal: isMobile ? 16 : 40,
                            paddingTop: isMobile ? 30 : 45,
                            paddingBottom: isMobile ? 40 : 55,
                        },
                    ]}
                >
                    <View style={{ width: '100%' }}>

                        <Text
                            style={[
                                styles.heroLabel,
                                {
                                    fontSize: isMobile ? 9 : 10,
                                },
                            ]}
                        >
                            GESTÃO DE TRADUÇÕES
                        </Text>

                        <Text
                            style={[
                                styles.heroTitle,
                                {
                                    fontSize: isMobile ? 24 : 32,
                                    lineHeight: isMobile ? 30 : 39,
                                },
                            ]}
                        >
                            Traduções organizadas.{'\n'}
                            Projetos sob controle.
                        </Text>

                        <Text
                            style={[
                                styles.heroSubtitle,
                                {
                                    fontSize: isMobile ? 12 : 14,
                                    lineHeight: isMobile ? 18 : 21,
                                },
                            ]}
                        >
                            Centralize clientes, equipes, orçamentos e projetos
                            em um único ambiente, facilitando o acompanhamento
                            de cada tradução do início à entrega.
                        </Text>

                        <Pressable
                            style={[
                                styles.ctaButton,
                                {
                                    paddingHorizontal: isMobile ? 20 : 26,
                                    paddingVertical: isMobile ? 10 : 11,
                                },
                            ]}
                            onPress={() => router.push('/login')}
                        >
                            <Text
                                style={[
                                    styles.ctaText,
                                    {
                                        fontSize: isMobile ? 12 : 13,
                                    },
                                ]}
                            >
                                Fazer Login
                            </Text>
                        </Pressable>

                    </View>
                </View>

            </View>

            {/* RECURSOS */}
            <View style={styles.resourcesSection}>

                {/* CARDS */}
                <View
                    style={[
                        styles.resourcesGrid,
                        {
                            paddingHorizontal: isMobile ? 12 : 20,
                            paddingTop: isMobile ? 16 : 28,
                            rowGap: isMobile ? 12 : 16,
                        },
                    ]}
                >
                    {cards.map((card, index) => (
                        <View
                            key={index}
                            style={{ width: cardWidth }}
                        >
                            <Pressable
                                style={({ pressed }) => [
                                    styles.resourceCard,
                                    {
                                        minHeight: isMobile ? 140 : 160,
                                    },
                                    pressed && styles.resourceCardHover,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.resourceNumber,
                                        {
                                            fontSize: isMobile ? 9 : 10,
                                        },
                                    ]}
                                >
                                    {card.number}
                                </Text>

                                <Text
                                    style={[
                                        styles.resourceTitle,
                                        {
                                            fontSize: isMobile ? 12 : 14,
                                        },
                                    ]}
                                >
                                    {card.title}
                                </Text>

                                <Text
                                    style={[
                                        styles.resourceDescription,
                                        {
                                            fontSize: isMobile ? 10 : 11,
                                        },
                                    ]}
                                >
                                    {card.description}
                                </Text>
                            </Pressable>
                        </View>
                    ))}
                </View>

            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({

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
        paddingTop: 20,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    logo: {
        color: '#FFFFFF',
        fontWeight: '800',
    },

    /* LINKS */
    navLink: {
        color: '#AAAAAA',
        fontWeight: '600',
    },

    /* CONTEÚDO DO HERO */
    heroContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    heroLabel: {
        color: '#888888',
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 14,
    },

    heroTitle: {
        color: '#FFFFFF',
        fontWeight: '800',
        marginBottom: 16,
    },

    heroSubtitle: {
        color: '#999999',
        marginBottom: 26,
    },

    /* BOTÕES PRINCIPAIS */
    ctaButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
    },

    ctaText: {
        fontWeight: '800',
        color: '#000000',
    },

    /* SEÇÃO DE RECURSOS */
    resourcesSection: {
        backgroundColor: '#FFFFFF',
    },

    /* GRID */
    resourcesGrid: {
        paddingBottom: 40,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    /* CARD */
    resourceCard: {
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
    },

    /* CARD AO PRESSIONAR */
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
    },

    /* NÚMERO */
    resourceNumber: {
        color: '#999999',
        fontWeight: '700',
        marginBottom: 12,
    },

    /* TÍTULO DOS CARDS */
    resourceTitle: {
        color: '#000000',
        fontWeight: '700',
        lineHeight: 18,
        marginBottom: 7,
    },

    /* DESCRIÇÃO DOS CARDS */
    resourceDescription: {
        color: '#777777',
        lineHeight: 16,
    },

});

