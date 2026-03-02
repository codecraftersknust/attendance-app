import React from 'react'

const Loading = () => {
    return (
        <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-200 border-t-emerald-600"></div>
        </div>
    )
}

export default Loading