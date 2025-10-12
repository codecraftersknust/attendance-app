import React from 'react'

const Loading = () => {
    return (
        <div className="flex justify-center items-center h-[70vh] bg-white/80">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-900"></div>
        </div>
    )
}

export default Loading