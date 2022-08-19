import { useEffect, useRef, useState } from 'react'
import BinaryButton from './BinaryButton'
import { host } from './config'
import './styles.css'
import TimeTable from './TimeTable'

const App = () => {
  const [loading, setLoading] = useState(true)
  const [branch, setBranch] = useState(localStorage.getItem('branch') || '')
  const [branchList, setBranchList] = useState([])
  const [dataListCourses, setDataListCourses] = useState([])
  const [inputCourse, setInputCourse] = useState('')
  const [myCourses, setMyCourses] = useState(
    localStorage.getItem('myCourses')
      ? JSON.parse(localStorage.getItem('myCourses'))
      : []
  )
  const addCourseToTimeTable = useRef(() => {})
  const [addedCourses, setAddedCourses] = useState([])
  const [practicalCourses, setPracticalCourses] = useState('blehh')
  const [results, setResults] = useState(-1)
  const tableRef = useRef(null)
  const currCredits = useRef(0)
  const myTimeTable = useRef(null)
  const [refreshTimeTable, setRefreshTimeTable] = useState(false)

  const addCoursesToTimeTable = async (dontAlert) => {
    if (myCourses.length < 1) return
    const ret = await fetch(`${host}add-courses`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(myCourses.map((course) => course.course_code)),
    })
    if (ret.ok) {
      if (!dontAlert) alert('Success!')
      setAddedCourses([...myCourses])
      localStorage.setItem('myCourses', JSON.stringify(myCourses))

      currCredits.current = myCourses.reduce(
        (prev, curr) => prev + curr.credits,
        0
      )
    }
  }

  const addCourse = (course) => {
    setDataListCourses([])
    setInputCourse('')
    myCourses.find((myCourse) => course.course_code === myCourse.course_code) ||
    setMyCourses([...myCourses, course])
  }

  const deleteCourse = (course) => {
    setMyCourses(
      myCourses.filter((myCourse) => myCourse.course_code !== course)
    )
  }

  const getTable = async () => {
    if (!branch) {
      alert('Please select a branch.')
      return
    }
    const coursesAdded =
      myCourses.length === addedCourses.length &&
      myCourses.reduce(
        (curr, val, index) =>
          curr & (val.course_code === addedCourses[index].course_code),
        true
      )
    if (!coursesAdded) await addCoursesToTimeTable()

    const offeredAs = Array.from(document.getElementsByClassName('offeredAs'))
      .filter((e) => e.checked)
      .map((e) => e.id)
      .join('|')

    const matkaCourses = document.getElementById('matkaCourses').checked

    const ret = await fetch(
      `${host}get-table?offered-as=${offeredAs}&matka-courses=${matkaCourses}&practical-courses=${practicalCourses}`
    )
    if (ret.ok) {
      tableRef.current.innerHTML = await ret.text()
      setResults(tableRef.current.getElementsByTagName('tr').length - 1)
      Array.from(tableRef.current.getElementsByTagName('tr')).forEach(
        (elem) => {
          elem.addEventListener(
            'dblclick',
            async (e) => {
              const tr = e.currentTarget
              const codeReg = /[A-Z]{2,3}\d{2,3}[A-Z]{1,2}/
              const code = codeReg.exec(tr.children[2].innerText)[0]
              const name = tr.children[2].innerText
              const creditReg = /\(\d{1,2}\)/
              const credits = Number(creditReg.exec(tr.children[4].innerText)[0].replace('(', '').replace(')', ''))
              const course = {
                course_code: code,
                'Course Name/Group Name': name,
                credits: credits,
              }
              setMyCourses([...myCourses, course])
              setTimeout(() => document.getElementById('bleh').click(), 500)
            },
            false
          )
        }
      )
    } else if (ret.status === 400) {
      alert(await ret.text())
    } else {
      window.location.reload()
    }
    setRefreshTimeTable(!refreshTimeTable)
  }

  const setBr = async (br) => {
    setBranch(br)
    await fetch(`${host}set-branch?branch=${br}`)
    localStorage.setItem('branch', br)
  }

  useEffect(() => {
    const setupApp = async () => {
      const ret = await fetch(`${host}`)
      setBranchList(await ret.json())
      await setBr(branch)
      // alert('Please select a branch and add courses.')
      // await getTable()
      setLoading(false)
    }
    setupApp()
    alert("How to use?\nEnter your current course name/code (Double click to delete it) and select the type you want and press Done!\nThe output table will not clash with any on your existing courses.\nDouble click on any course in output table to add it to existing courses.")
  }, [])

  return loading ? (
    <>Loading...</>
  ) : (
    <div className="py-5 h-screen w-screen bg-darkBackground text-white overflow-y-auto">
      <div className="flex flex-col justify-start items-center ">
        <h1 className="text-3xl m-4">IIT Kanpur Easy Scheduler</h1>
        <div className="flex flex-col items-start w-[340px]">
          <label htmlFor="branch">
            Select Branch:&nbsp;
            <select
              id="branch"
              value={branch}
              className="rounded-md text-black w-20 bg-red-200 p-1 m-1"
              onChange={async (e) => {
                await setBr(e.target.value)
              }}
            >
              <option value="" disabled>
                Select
              </option>
              {branchList.map((branch, index) => (
                <option value={branch} key={index}>
                  {branch}
                </option>
              ))}
            </select>
          </label>
          <div className="my-2">
            <label className="inline-flex">
              Enter Current Courses:&nbsp;
              <input
                type={'text'}
                list="courseList"
                id="inputCourse"
                autoFocus={true}
                placeholder="Enter Course Code/Name"
                className="rounded-lg p-1 max-h-10 w-full bg-red-200 text-black"
                onChange={(e) => setInputCourse(e.target.value)}
                value={inputCourse}
                onKeyUp={async (e) => {
                  if (e.target.value.length < 2) return
                  const ret = await fetch(
                    `${host}/search-courses?input=${e.target.value.toUpperCase()}`
                  )
                  const courses = Object.values(await ret.json())

                  if (courses.length === 1) addCourse(courses[0])
                  else setDataListCourses(courses)
                }}
              />
              <datalist id="courseList">
                {dataListCourses.map((course, index) => (
                  <option value={course.course_code} key={index}>
                    {`${course['Course Name/Group Name']} (${course.credits})`}
                  </option>
                ))}
              </datalist>
            </label>
            <div hidden={!myCourses.length}>
              <div className="flex flex-col bg-white text-black rounded-lg overflow-auto">
                <ol type="1" className="px-2 py-1 flex flex-col justify-evenly">
                  {myCourses.map((course, index) => (
                    <li key={index}>
                      <button
                        className="rounded-lg bg-rose-200 hover:bg-red-500 p-1 my-1 text-left text-sm"
                        type="button"
                        onDoubleClick={() => deleteCourse(course.course_code)}
                      >
                        <span className="font-bold text-xl">{index + 1}</span>
                        {course['Course Name/Group Name']} ({course.credits})
                      </button>
                    </li>
                  ))}
                </ol>
                <button
                  className="bg-green-300 hover:bg-green-500 p-2 text-lg text-black"
                  type="button"
                  onClick={async () => {
                    if (myCourses.length < 1) return
                    addCoursesToTimeTable()
                  }}
                >
                  Add Courses!
                </button>
              </div>
            </div>
            <div className="border-b-2 my-2 border-gray-500"></div>
            <div className="flex flex-col">
              <h2 className="text-lg">Course Offered As</h2>
              <div className="flex my-1">
                <BinaryButton text={'OE'} className="offeredAs" id="OE" />
                <BinaryButton text={'DE'} className="offeredAs" id="DE" />
                <BinaryButton text={'DC'} className="offeredAs" id="DC" />
                <BinaryButton text={'IC'} className="offeredAs" id="IC" />
              </div>
              <div className="flex my-1">
                <BinaryButton text={"SO's"} className="offeredAs" id="SO" />
                <BinaryButton text={'HSS1'} className="offeredAs" id="HSS1" />
                <BinaryButton text={'HSS2'} className="offeredAs" id="HSS2" />
                <BinaryButton text={'UGP'} className="offeredAs" id="UGP" />
              </div>
            </div>
            <div className="border-b-2 my-2 border-gray-500"></div>
            <div>
              <h2 className="text-lg">Matka Courses</h2>
              <BinaryButton
                text={'Exclude matka courses'}
                id="matkaCourses"
                buttonWidth="w-full"
                className="matka-courses"
              />
            </div>
            <div className="border-b-2 my-2 border-gray-500"></div>
            <div>
              <h2 className="text-lg">Practical Courses</h2>
              <select
                value={practicalCourses}
                className="rounded-md text-black w-full bg-red-200 p-2 m-1"
                onChange={(e) => setPracticalCourses(e.target.value)}
              >
                <option value="">Don't Care</option>
                <option value="exclude">Exclude</option>
                <option value="only">Only Practical Courses</option>
              </select>
            </div>
            <div className="border-b-2 my-2 border-gray-500"></div>
            <button
              className="bg-green-500 w-full p-2 rounded-lg"
              onClick={getTable}
              id="bleh"
            >
              DONE!
            </button>
          </div>
        </div>
      </div>
      <div className="text-center my-1 w-full">
        Total credits currently persuing {currCredits.current}
      </div>
      <div className="flex flex-col items-center">
        <TimeTable
          timeTable={myTimeTable.current}
          myCourses={myCourses}
          refresh={refreshTimeTable}
          addCourseFunction={addCourseToTimeTable}
        />
      </div>
      <div className="text-center w-full">
        {results > -1 ? (
          results !== 0 ? (
            <h2 className="text-lg">Showing {results} Results</h2>
          ) : (
            <h2 className="text-lg">No Results Found</h2>
          )
        ) : (
          <></>
        )}
      </div>

      <div ref={tableRef} className="text-center" hidden={results < 1}></div>
    </div>
  )
}

export default App
