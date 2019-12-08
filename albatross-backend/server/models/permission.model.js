module.exports = function (mongoose) {
    let modelName = 'permission'
    let Types = mongoose.Schema.Types
    let Schema = new mongoose.Schema(
        {
            identification: {
                type: Types.String,
                require: true
            },
            type: {
                // 类型：d：目录 m：菜单 b：按钮 a：接口
                enum: ['d', 'm', 'b', 'a'],
                type: Types.String,
                require: true
            },
            role: {
                type: Types.ObjectId,
                ref: 'role'
            }
        },
        {collection: modelName}
    )

    Schema.statics = {
        collectionName: modelName,
        routeOptions: {
            associations: {
                role: {
                    type: 'MANY_ONE',
                    model: 'role',
                    duplicate: ['name']
                }
            }
        }
    }

    return Schema
}
