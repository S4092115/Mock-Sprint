export default function TeamPage() {
  const teamMembers = [
    {
      name: "Tommy Flasza",
      role: "Project Manager",
      photo: "/team/Tommy.jpg",
      blurb: "Coordinate timelines, manage the team, and keep the project on track."
    },
    {
      name: "Samuel Brooks",
      role: "Business Analyst",
      photo: "/team/Samuel.png",
      blurb: "Define requirements, analyse stakeholder needs, and bridge business with tech."
    },
    {
      name: "UX",
      role: "UX",
      photo: "/team/",
      blurb: "Design user flows, wireframes, and prototypes for intuitive experiences."
    },
    {
      name: "Henry Vo",
      role: "Developer",
      photo: "/team/Henry.jpg",
      blurb: "Build the solution, code, architecture, testing, and deployment."
    },
    {
      name: "Jun Chan",
      role: "Developer",
      photo: "/team/Jun.png",
      blurb: "Build the solution, code, architecture, testing, and deployment."
    }
  ];
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-center">
        Team B
      </h1>
      <p className="text-center mt-2 mb-8">
        Meet our team
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            className="border rounded-lg p-5 text-center"
          >
            <img
              src={member.photo}
              alt={member.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
            <h2 className="text-xl font-bold">
              {member.name}
            </h2>
            <p className="font-semibold mt-1">
              {member.role}
            </p>
            <p className="mt-3">
              {member.blurb}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}