import { router } from 'expo-router';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    useWindowDimensions,
} from 'react-native';

const HIGHLIGHTS = [
    'Requisições',
    'Orçamentos',
    'Workflows',
    'Entregas',
] as const;

const ROLE_CARDS = [
    {
        number: 'A',
        title: 'Atendente',
        description:
            'Recebe a requisição do cliente, registra o pedido e conduz orçamentos a partir das solicitações.',
    },
    {
        number: 'G',
        title: 'Gestor de projeto',
        description:
            'Pré-cadastra freelancers, revisa e ativa prestadores, e mantém modelos de workflow reutilizáveis para novos projetos.',
    },
    {
        number: 'F',
        title: 'Freelancer',
        description:
            'Completa o cadastro como tradutor, revisor, formatador ou intérprete, informando idiomas, habilidades e documentos.',
    },
    {
        number: 'D',
        title: 'Administrador',
        description:
            'Cadastra funcionários internos com grupos de permissão e define tabelas de preço por par de idioma para orçamentos.',
    },
] as const;

const FLOW_CARDS = [
    {
        number: '01',
        title: 'Requisição',
        description:
            'O atendente registra o pedido do cliente: documentos, idiomas, prazo e dados do serviço.',
    },
    {
        number: '02',
        title: 'Orçamento',
        description:
            'Montagem da proposta com tabelas de preço, itens adicionais e observações para o cliente.',
    },
    {
        number: '03',
        title: 'Aprovação',
        description:
            'Confirmação do cliente sobre a proposta, liberando a abertura do trabalho.',
    },
    {
        number: '04',
        title: 'Ordem de serviço',
        description:
            'O gestor estrutura o projeto a partir do workflow, com etapas e tipo de prestador em cada fase.',
    },
    {
        number: '05',
        title: 'Execução',
        description:
            'Freelancers executam tradução, revisão ou formatação, com entregas e encaminhamento entre etapas.',
    },
    {
        number: '06',
        title: 'Entrega final',
        description:
            'Conferência das etapas concluídas e envio do material traduzido ao cliente.',
    },
] as const;

export default function LandingPage() {
    const { width } = useWindowDimensions();
    const isCompact = width < 900;
    const flowCardWidth = isCompact ? '100%' : width < 1200 ? '48%' : '31.5%';
    const roleCardWidth = isCompact ? '100%' : width < 1100 ? '48%' : '48%';

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.glowTop} pointerEvents="none" />
            <View style={styles.glowBottom} pointerEvents="none" />

            <View style={styles.heroTop}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>SoftTranslations</Text>
                </View>

                <Pressable
                    style={styles.navLoginButton}
                    onPress={() => router.push('/login')}
                >
                    <Text style={styles.navLoginText}>Login</Text>
                </Pressable>
            </View>

            <View
                style={[
                    styles.heroContent,
                    isCompact && styles.heroContentCompact,
                ]}
            >
                <View
                    style={[
                        styles.heroInfo,
                        isCompact && styles.heroInfoCompact,
                    ]}
                >

                    <Text style={styles.heroLabel}>GESTÃO DE TRADUÇÕES</Text>

                    <Text style={styles.heroTitle}>
                        Traduções organizadas.{'\n'}
                        Projetos sob controle.
                    </Text>

                    <Text style={styles.heroSubtitle}>
                        Plataforma para atendentes, gestores, administradores e
                        prestadores trabalharem juntos — do pedido do cliente à
                        entrega final.
                    </Text>

                    <View style={styles.highlightRow}>
                        {HIGHLIGHTS.map((item) => (
                            <View key={item} style={styles.highlightPill}>
                                <Text style={styles.highlightText}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.ctaRow}>
                        <Pressable
                            style={styles.ctaButton}
                            onPress={() => router.push('/login')}
                        >
                            <Text style={styles.ctaText}>Fazer Login</Text>
                        </Pressable>

                        <Pressable
                            style={styles.ctaButtonOutline}
                            onPress={() => router.push('/orcamentos/FazerSolicitacao')}
                        >
                            <Text style={styles.ctaTextOutline}>Solicitar Orçamento</Text>
                        </Pressable>
                    </View>
                </View>

                {!isCompact && (
                    <View style={styles.heroVisual}>
                        <View style={styles.visualPanel}>
                            <Text style={styles.visualLabel}>
                                VISÃO DO PROJETO
                            </Text>
                            <View style={styles.visualLine}>
                                <View style={styles.visualDotActive} />
                                <View style={styles.visualLineBar} />
                                <View style={styles.visualDot} />
                                <View style={styles.visualLineBarShort} />
                                <View style={styles.visualDot} />
                            </View>
                            <View style={styles.visualDocStack}>
                                <View
                                    style={[
                                        styles.visualDoc,
                                        styles.visualDocBack,
                                    ]}
                                />
                                <View
                                    style={[
                                        styles.visualDoc,
                                        styles.visualDocMid,
                                    ]}
                                />
                                <View style={styles.visualDocFront}>
                                    <View style={styles.visualDocLine} />
                                    <View
                                        style={[
                                            styles.visualDocLine,
                                            styles.visualDocLineShort,
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.visualDocLine,
                                            styles.visualDocLineMedium,
                                        ]}
                                    />
                                    <View style={styles.visualDocBadge}>
                                        <Text style={styles.visualDocBadgeText}>
                                            Em andamento
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.visualMetaRow}>
                                <Text style={styles.visualMeta}>
                                    Tradução · Revisão · Entrega
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.sectionDivider} />

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>EQUIPE</Text>
                <Text style={styles.sectionTitle}>
                    Cada perfil com sua função na operação
                </Text>
            </View>

            <View style={styles.rolesGrid}>
                {ROLE_CARDS.map((card) => (
                    <Pressable
                        key={card.title}
                        style={({ hovered }) => [
                            styles.roleCard,
                            { width: roleCardWidth },
                            hovered && styles.cardHover,
                        ]}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>
                                    {card.number}
                                </Text>
                            </View>
                            <View style={styles.resourceAccent} />
                        </View>
                        <Text style={styles.cardTitle}>{card.title}</Text>
                        <Text style={styles.cardDescription}>
                            {card.description}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <View style={styles.sectionDivider} />

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>FLUXO</Text>
                <Text style={styles.sectionTitle}>
                    Do pedido à entrega, em seis etapas
                </Text>
            </View>

            <View style={styles.flowGrid}>
                {FLOW_CARDS.map((card) => (
                    <Pressable
                        key={card.number}
                        style={({ hovered }) => [
                            styles.flowCard,
                            { width: flowCardWidth },
                            hovered && styles.cardHover,
                        ]}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.flowNumber}>{card.number}</Text>
                            <View style={styles.resourceAccent} />
                        </View>
                        <Text style={styles.cardTitle}>{card.title}</Text>
                        <Text style={styles.cardDescription}>
                            {card.description}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerBrand}>SoftTranslations</Text>
                <Text style={styles.footerText}>
                    Desenvolvido pela SoftworksBr em parceria com a Aliança
                    Traduções
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },

    contentContainer: {
        flexGrow: 1,
        backgroundColor: '#000000',
        paddingBottom: 48,
        position: 'relative',
    },

    glowTop: {
        position: 'absolute',
        top: -80,
        right: -60,
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },

    glowBottom: {
        position: 'absolute',
        bottom: 120,
        left: -80,
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },

    heroTop: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1,
    },

    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    logoMark: {
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: '#FFFFFF',
    },

    logo: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },

    navLoginButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#333333',
        backgroundColor: '#0A0A0A',
    },

    navLoginText: {
        color: '#DDDDDD',
        fontSize: 13,
        fontWeight: '600',
    },

    heroContent: {
        paddingHorizontal: 40,
        paddingTop: 36,
        paddingBottom: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1,
    },

    heroContentCompact: {
        paddingHorizontal: 24,
    },

    heroInfo: {
        flex: 1,
        maxWidth: 560,
        paddingRight: 24,
    },

    heroInfoCompact: {
        maxWidth: '100%',
        paddingRight: 0,
    },

    heroTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        backgroundColor: '#0F0F0F',
        marginBottom: 16,
    },

    heroTagText: {
        color: '#BBBBBB',
        fontSize: 11,
        fontWeight: '600',
    },

    heroLabel: {
        color: '#777777',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 12,
    },

    heroTitle: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: '800',
        lineHeight: 42,
        marginBottom: 16,
    },

    heroSubtitle: {
        color: '#999999',
        fontSize: 15,
        lineHeight: 23,
        marginBottom: 22,
    },

    highlightRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 28,
    },

    highlightPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: '#252525',
    },

    highlightText: {
        color: '#CCCCCC',
        fontSize: 11,
        fontWeight: '600',
    },

    ctaButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 28,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
    },

    ctaText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#000000',
    },

    ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
},

ctaButtonOutline: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    backgroundColor: 'transparent',
},

ctaTextOutline: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
},

    heroVisual: {
        width: 380,
        alignItems: 'flex-end',
    },

    visualPanel: {
        width: '100%',
        padding: 22,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222222',
        backgroundColor: '#0A0A0A',
    },

    visualLabel: {
        color: '#666666',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 16,
    },

    visualLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 22,
    },

    visualDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#333333',
    },

    visualDotActive: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFFFFF',
    },

    visualLineBar: {
        flex: 1,
        height: 2,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 6,
        maxWidth: 72,
    },

    visualLineBarShort: {
        flex: 1,
        height: 2,
        backgroundColor: '#333333',
        marginHorizontal: 6,
        maxWidth: 72,
    },

    visualDocStack: {
        height: 140,
        position: 'relative',
        marginBottom: 14,
    },

    visualDoc: {
        position: 'absolute',
        width: '88%',
        height: 100,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        backgroundColor: '#111111',
    },

    visualDocBack: {
        top: 18,
        left: 24,
        opacity: 0.5,
    },

    visualDocMid: {
        top: 9,
        left: 12,
        opacity: 0.75,
    },

    visualDocFront: {
        top: 0,
        left: 0,
        width: '88%',
        height: 110,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3A3A3A',
        backgroundColor: '#141414',
        padding: 14,
    },

    visualDocLine: {
        height: 4,
        borderRadius: 2,
        backgroundColor: '#2E2E2E',
        marginBottom: 8,
        width: '100%',
    },

    visualDocLineShort: {
        width: '55%',
    },

    visualDocLineMedium: {
        width: '78%',
    },

    visualDocBadge: {
        alignSelf: 'flex-start',
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },

    visualDocBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#000000',
    },

    visualMetaRow: {
        borderTopWidth: 1,
        borderTopColor: '#1A1A1A',
        paddingTop: 12,
    },

    visualMeta: {
        color: '#666666',
        fontSize: 11,
    },

    sectionDivider: {
        height: 1,
        backgroundColor: '#1A1A1A',
        marginHorizontal: 24,
    },

    sectionHeader: {
        paddingHorizontal: 28,
        paddingTop: 40,
        paddingBottom: 8,
    },

    sectionLabel: {
        color: '#666666',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 10,
    },

    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 28,
        maxWidth: 520,
    },

    rolesGrid: {
        paddingHorizontal: 20,
        paddingTop: 24,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 16,
    },

    flowGrid: {
        paddingHorizontal: 20,
        paddingTop: 24,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 16,
    },

    roleCard: {
        minHeight: 132,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#222222',
        borderRadius: 14,
        padding: 18,
    },

    flowCard: {
        minHeight: 148,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#222222',
        borderRadius: 14,
        padding: 18,
    },

    cardHover: {
        borderColor: '#444444',
        backgroundColor: '#0F0F0F',
        transform: [{ translateY: -2 }],
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    roleBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#151515',
        borderWidth: 1,
        borderColor: '#333333',
        alignItems: 'center',
        justifyContent: 'center',
    },

    roleBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },

    flowNumber: {
        color: '#555555',
        fontSize: 10,
        fontWeight: '700',
    },

    resourceAccent: {
        width: 20,
        height: 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 1,
    },

    cardTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
        marginBottom: 8,
    },

    cardDescription: {
        color: '#888888',
        fontSize: 12,
        lineHeight: 18,
    },

    footer: {
        paddingHorizontal: 24,
        paddingTop: 44,
        alignItems: 'center',
    },

    footerBrand: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 6,
    },

    footerText: {
        color: '#555555',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 17,
        maxWidth: 400,
    },
});
