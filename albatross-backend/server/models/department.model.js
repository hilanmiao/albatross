module.exports = function (mongoose) {
    let modelName = 'department'
    let Types = mongoose.Schema.Types
    let Schema = new mongoose.Schema(
        {
            name: {
                type: Types.String,
                require: true,
                unique: true
            },
            parentId: {
                type: Types.String
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
                    foreignField: 'department',
                    model: 'user'
                }
            }
        }
    }

    return Schema
}
