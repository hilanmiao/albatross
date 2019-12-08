module.exports = function (mongoose) {
    let modelName = 'role'
    let Types = mongoose.Schema.Types
    let Schema = new mongoose.Schema(
        {
            name: {
                type: Types.String,
                require: true,
                unique: true
            },
            remark: {
                type: Types.String,
                require: true
            }
        },
        {collection: modelName}
    )

    Schema.statics = {
        collectionName: modelName,
        routeOptions: {
            associations: {
                users: {
                    type: 'ONE_MANY',
                    alias: 'user',
                    foreignField: 'role',
                    model: 'user'
                },
                permissions: {
                    type: 'ONE_MANY',
                    alias: 'permission',
                    foreignField: 'role',
                    model: 'permission'
                }
            }
        }
    }

    return Schema
}
