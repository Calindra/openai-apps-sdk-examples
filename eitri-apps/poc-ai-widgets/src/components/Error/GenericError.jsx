import Eitri from 'eitri-bifrost'
import { Text, View, Button } from "eitri-luminus";

/**
 * Função de Erro Genérico.
 * 
 * @param {function} onRetryPress Função a ser executada ao pressionar o botão TENTAR NOVAMENTE.
 * 
 */
export default function GenericError(props) {
    const { onRetryPress =() => {console.log("onRetryPress not implemented")} } = props
    const [appSlug, setAppSlug] = useState('')

    async function getConfigs() {
        try {
            const configs = await Eitri.getConfigs()
            setAppSlug(configs?.miniAppData?.slug)
        } catch (error) {
            console.error("@GenericError.getConfigs", error)
        }
    }
    getConfigs()

    function onCancelPress() {
        Eitri.navigation.backToTop()
    }

    const date = new Date(Date.now());
    const formattedDateHour = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(date)

    return (
        <View className="flex items-center justify-center min-h-[85vh] bg-opacity-90">
            <View className="flex flex-col w-full h-full max-w-md rounded-2xl">
                <View className="w-full flex justify-center items-center">
                    <View className="bg-slate-50 p-4 flex justify-center items-center rounded-full w-[30%] h-[15vh]">
                        <Text className="!text-[100px] font-bold text-center">!</Text>
                    </View>
                </View>
                <View className="flex flex-col h-full p-4">
                    <Text className="font-bold text-[23px] mt-5 mb-4 text-center">
                        Não foi possível continuar
                    </Text>
                    <Text className="!text-[16px] text-center">
                        Verifique a conexão com a internet do seu dispositivo ou atualizações do aplicativo
                    </Text>
                </View>
                <View className="absolute bottom-[8%] left-1/2 transform -translate-x-1/2 flex flex-col justify-center w-full items-center">
                    <Button className="btn bg-black/60 text-white/90 font-medium text-[16px] flex items-center px-0 shadow-none pb-0 w-[80%]" onClick={onRetryPress}>
                        TENTAR NOVAMENTE
                    </Button>
                    <Button className="btn bg-white border-transparent mt-[10px] text-black/60 font-medium text-[16px] items-center px-0 shadow-none pb-0 w-[80%]" onClick={onCancelPress}>
                        CANCELAR
                    </Button>
                    <Text className="!text-[14px] text-center relative top-[25px]">
                        {formattedDateHour}
                    </Text>
                    <Text className="!text-[14px] text-center relative top-[25px]">
                        {appSlug ?? ''}
                    </Text>
                </View>
            </View>
        </View>
    )
}




