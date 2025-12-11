/**
 * Middleware de tratamento de erros
 */
export const errorHandler = (error, req, res, next) => {
    console.error('❌ Erro:', error);

    // Erros de validação do Sequelize
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({
            message: 'Erro de validação',
            errors: messages
        });
    }

    // Erros de constraint único
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            message: 'Registro duplicado',
            field: error.errors[0]?.path
        });
    }

    // Erros de foreign key
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            message: 'Referência inválida',
            detail: error.message
        });
    }

    // Erro genérico
    res.status(error.status || 500).json({
        message: error.message || 'Erro interno do servidor'
    });
};