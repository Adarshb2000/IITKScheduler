import './styles.css'

const myBadTimeTable = ({ timeTable, myCourses }) => {
  const myTimeTable = timeTable[0].map((_, colIndex) =>
    timeTable.map((row) => row[colIndex])
  )
  return (
    <div className="text-center">
      <table className="time-table">
        <thead>
          <tr>
            <th className="w-32">Time/Day</th>
            <th className="w-32">Monday</th>
            <th className="w-32">Tuesday</th>
            <th className="w-32">Wednesay</th>
            <th className="w-32">Thursday</th>
            <th className="w-32">Friday</th>
          </tr>
        </thead>
        <tbody>
          {myTimeTable.map((_, index) =>
            !(index % 4) ? (
              <tr className="time-table-row border-0" key={index}>
                <td>{index / 4 + 8}:00</td>
                <td colSpan={5}>
                  <div className="w-full">
                    <table>
                      <tbody>
                        {myTimeTable
                          .slice(index, index + 4)
                          .map((row, index) => {
                            console.log(myTimeTable.slice(index, index + 4))
                            return (
                              <tr className="border-0">
                                {row.map((col, index) => {
                                  return (
                                    <td
                                      className={`${
                                        col.length === 0
                                          ? 'bg-gray-200'
                                          : col.length === 1
                                          ? 'bg-green-500'
                                          : 'bg-red-500'
                                      } w-32 h-4 border-y-0`}
                                      key={index}
                                    ></td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            ) : (
              <></>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}

export default myBadTimeTable
