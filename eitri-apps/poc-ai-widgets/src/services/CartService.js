import { Vtex } from 'eitri-shopping-vtex-shared'

export const getCart = async () => {
	try {
		const cart = await Vtex.cart.getCurrentOrCreateCart()
		return cart
	} catch (error) {
		console.log('Erro ao buscar carrinho', error)
		throw error
	}
}

export const addItemToCart = async payload => {
	try {
		let item = payload
		if (payload instanceof Array) {
			item = payload[0]
		}
		return await Vtex.cart.addItem({ item })
	} catch (error) {
		console.error('Erro ao adicionar item ao carrinho', error)
		// crashLog('Erro ao adicionar item ao carrinho', error)
	}
}

export const removeCartItem = async index => {
	try {
		return await Vtex.cart.removeItem(index)
	} catch (error) {
		console.error('Erro ao adicionar item ao carrinho', error)
		// crashLog('Erro ao adicionar item ao carrinho', error)
	}
}

export const changeItemQuantity = async (index, newQuantity) => {
	try {
		return await Vtex.cart.changeItemQuantity(index, newQuantity)
	} catch (error) {
		console.error('Erro ao atualizar item no carrinho', error)
		// crashLog('Erro ao adicionar item ao carrinho', error)
	}
}
