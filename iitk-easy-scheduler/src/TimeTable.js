import './TimeTable.css'
import Timetable from 'react-timetable-events'
import { host } from './config'
import { useRef, useState } from 'react'
import { useEffect } from 'react'

const TimeTable = ({ timeTable, myCourses, refresh, addCourseFunction }) => {
  const dayCodes = {
    M: [0, 'Monday'],
    T: [1, 'Tuesday'],
    W: [2, 'Wednesday'],
    Th: [3, 'Thursday'],
    F: [4, 'Friday'],
  }
  const myTimeTable = useRef({})
  const [blehh, forceRender] = useState(false)
  const eventCounter = useRef(0)

  addCourseFunction.current = (tr) => {
    if (!tr) return
    const codeReg = /[A-Z]{2,3}\d{2,3}[A-Z]{1,2}/
    const name = codeReg.exec(tr.children[2].innerText)[0]
    const timings = tr.children[tr.children.length - 1].innerText
    const type = tr.children[tr.children.length - 2].innerText
    addEvent({ name, timings, type })
    forceRender(!blehh)
  }

  const convertToDateTime = (day, time) =>
    new Date(0, 0, dayCodes[day][0] + 1, ...time.split(':'))

  const addEvent = ({ name, timings, type }) => {
    if (!timings) return
    timings.split(' ').forEach((dayTime) => {
      const [day, times] = dayTime.split('=')
      times.split(',').forEach((time) => {
        const temp = {
          id: `Event${eventCounter.current}`,
          courses: [
            {
              name: name,
              time: time,
            },
          ],
          startTime: convertToDateTime(day, time.split('-')[0]),
          endTime: convertToDateTime(day, time.split('-')[1]),
          type: type,
          clash: false,
        }

        var flag = false

        myTimeTable.current[dayCodes[day][1]].forEach((event) => {
          if (
            event.startTime.getTime() < temp.endTime.getTime() &&
            event.endTime.getTime() > temp.startTime.getTime() &&
            event.type * temp.type !== 2
          ) {
            if (
              event.courses.reduce(
                (prev, course) => prev || course.name === name,
                false
              )
            )
              return
            event.courses.push({
              name: name,
              time: time,
            })
            event.startTime = new Date(
              Math.min(event.startTime.getTime(), temp.startTime.getTime())
            )
            event.endTime = new Date(
              Math.max(event.endTime.getTime(), temp.endTime.getTime())
            )
            event.type = 0
            event.clash = true
            flag = true
          }
        })
        flag || myTimeTable.current[dayCodes[day][1]].push(temp)
        eventCounter.current += 1
      })
    })
  }

  const getTimeTable = async () => {
    const ret = await fetch(`${host}get-my-course-timings`)
    if (ret.ok) {
      const courseTimings = await ret.json()
      // updateMyTimeTable(courseTimings)
      courseTimings.forEach(addEvent)
      forceRender(!blehh)
    } else {
      console.log(ret)
    }
  }
  useEffect(() => {
    getTimeTable()
    myTimeTable.current = Object.fromEntries(
      Object.values(dayCodes).map(([_, val]) => [val, []])
    )
  }, [refresh])

  const renderEvent = ({ event, defaultAttributes, classNames }) => {
    defaultAttributes.className += ' rounded-lg'
    return (
      <div
        key={event.id}
        style={defaultAttributes.style}
        className={defaultAttributes.className}
      >
        <div
          className={`event ${!event.clash ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {event.courses.map((course, index) => (
            <div key={index}>
              <span className={`${classNames.event_info} font-bold`}>
                {course.name}
              </span>
              <br />
              <span className={classNames.event_info}>{course.time}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return eventCounter.current ? (
    <Timetable
      events={myTimeTable.current}
      style={{
        height: '600px',
        width: '90%',
        maxWidth: '600px',
      }}
      hoursInterval={{ from: 8, to: 19 }}
      renderEvent={renderEvent}
    />
  ) : (
    <></>
  )
}

export default TimeTable
