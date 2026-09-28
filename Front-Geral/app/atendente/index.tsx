import { Redirect, type Href } from 'expo-router';

export default function AtendenteIndex() {
	return <Redirect href={'/atendente/requisicoes' as Href} />;
}
